// @ts-check
const pino = require('pino');
const {
  dbQuery,
  getClient,
  getPolkadotAPI,
  isNodeSynced,
  wait,
  shortHash,
  storeExtrinsics,
  storeEvents,
  storeLogs,
  getDisplayName,
  updateTotals,
  updateFinalized,
  updateAccountsInfo,
} = require('../lib/utils');
const backendConfig = require('../backend.config');

const logger = pino({
  level: backendConfig.logLevel,
});
const loggerOptions = {
  crawler: 'blockListener',
};

const crawler = async () => {
  logger.info(loggerOptions, 'Starting block listener crawler...');

  const client = await getClient(loggerOptions);
  let api = await getPolkadotAPI(loggerOptions);
  while (!api) {
    // eslint-disable-next-line no-await-in-loop
    await wait(10000);
    // eslint-disable-next-line no-await-in-loop
    api = await getPolkadotAPI(loggerOptions);
  }

  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    // eslint-disable-next-line no-await-in-loop
    await wait(10000);
    // eslint-disable-next-line no-await-in-loop
    synced = await isNodeSynced(api, loggerOptions);
  }

  // Subscribe to new blocks
  await api.rpc.chain.subscribeNewHeads(async (blockHeader) => {
    const startTime = new Date().getTime();

    // Get block hash
    const blockNumber = blockHeader.number.toNumber();
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);

    // {
    //   "activeEra": "0x00000948",
    //   "activeEraStart": 1623734874003,
    //   "currentEra": "0x00000949",
    //   "currentIndex": "0x000034f1",
    //   "validatorCount": "0x00000384",
    //   "eraLength": "0x00000e10",
    //   "isEpoch": true,
    //   "sessionLength": "0x0000000000000258",
    //   "sessionsPerEra": "0x00000006",
    //   "eraProgress": "0x00000ce5",
    //   "sessionProgress": "0x0000012d"
    // }

    // Parallelize
    const [
      {
        currentEra,
        currentIndex,
        eraLength,
        isEpoch,
        sessionsPerEra,
        validatorCount,
        eraProgress,
        sessionProgress,
      },
      { block },
      extendedHeader,
      runtimeVersion,
      finalizedBlockHash,
      totalIssuance,
      timestampMs,
    ] = await Promise.all([
      api.derive.session.progress(),
      api.rpc.chain.getBlock(blockHash),
      api.derive.chain.getHeader(blockHash),
      api.rpc.state.getRuntimeVersion(blockHash),
      api.rpc.chain.getFinalizedHead(),
      api.query.balances.totalIssuance.at(blockHash),
      api.query.timestamp.now.at(blockHash),
    ]);

    const finalizedBlockHeader = await api.rpc.chain.getHeader(finalizedBlockHash);
    const finalizedBlock = finalizedBlockHeader.number.toNumber();
    const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;

    // Handle chain reorganizations
    let sql = `SELECT block_number FROM block WHERE block_number = '${blockNumber}'`;
    let res = await dbQuery(client, sql, loggerOptions);

    if (res && res.rows.length > 0) {
      // Chain reorganization detected! We need to update block_author, block_hash and state_root
      logger.debug(loggerOptions, `Detected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root`);
      const blockAuthor = extendedHeader.author;
      const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
      const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
      sql = `UPDATE block SET block_author = '${blockAuthor}', block_author_name = '${blockAuthorName}', block_hash = '${blockHash}', state_root = '${stateRoot}' WHERE block_number = '${blockNumber}'`;
      res = await client.query(sql);
    } else {
      const blockAuthor = extendedHeader.author || '';
      const [
        blockAuthorIdentity,
        blockEvents,
        chainElectionStatus,
      ] = await Promise.all([
        api.derive.accounts.info(blockAuthor),
        api.query.system.events.at(blockHash),
        api.query.electionProviderMultiPhase.currentPhase(),
      ]);
      const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);

      // Get election status
      const isElection = Object.getOwnPropertyNames(chainElectionStatus.toJSON())[0] !== 'off';

      // Get epoch duration
      const { epochDuration } = api.consts.babe;

      // Totals
      const totalEvents = blockEvents.length || 0;
      const totalExtrinsics = block.extrinsics.length;

      // Store new block
      logger.debug(loggerOptions, `Adding block #${blockNumber} (${shortHash(blockHash.toString())})`);
      const timestamp = Math.floor(parseInt(timestampMs.toString(), 10) / 1000);

      sql = `INSERT INTO block (
          block_number,
          finalized,
          block_author,
          block_author_name,
          block_hash,
          parent_hash,
          extrinsics_root,
          state_root,
          current_era,
          current_index,
          era_length,
          era_progress,
          is_epoch,
          is_election,
          session_length,
          session_per_era,
          session_progress,
          validator_count,
          spec_name,
          spec_version,
          total_events,
          total_extrinsics,
          total_issuance,
          timestamp
        ) VALUES (
          '${blockNumber}',
          false,
          '${blockAuthor}',
          '${blockAuthorName}',
          '${blockHash}',
          '${parentHash}',
          '${extrinsicsRoot}',
          '${stateRoot}',
          '${currentEra.toString()}',
          '${currentIndex.toString()}',
          '${eraLength.toString()}',
          '${eraProgress.toString()}',
          '${isEpoch}',
          '${isElection}',
          '${epochDuration.toString()}',
          '${sessionsPerEra.toString()}',
          '${sessionProgress.toString()}',
          '${validatorCount}',
          '${runtimeVersion.specName}',
          '${runtimeVersion.specVersion}',
          '${totalEvents}',
          '${totalExtrinsics}',
          '${totalIssuance.toString()}',
          '${timestamp}'
        )
        ON CONFLICT ON CONSTRAINT block_pkey 
        DO NOTHING
        ;`;

      try {
        await client.query(sql);
      } catch (error) {
        logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}, sql: ${sql}`);
      }

      await Promise.all([
        // Store block extrinsics
        storeExtrinsics(
          api,
          client,
          blockNumber,
          blockHash,
          block.extrinsics,
          blockEvents,
          timestamp,
          loggerOptions,
        ),
        // Get involved addresses from block events and update its balances
        updateAccountsInfo(
          api,
          client,
          blockNumber,
          timestamp,
          loggerOptions,
          blockEvents,
        ),
        // Store module events
        storeEvents(
          client,
          blockNumber,
          blockEvents,
          timestamp,
          loggerOptions,
        ),
        // Store block logs
        storeLogs(
          client,
          blockNumber,
          blockHeader.digest.logs,
          timestamp,
          loggerOptions,
        ),
        // Update finalized blocks
        updateFinalized(client, finalizedBlock, loggerOptions),
      ]);

      // Update totals (async)
      updateTotals(client, loggerOptions);

      const endTime = new Date().getTime();
      logger.info(loggerOptions, `Block #${blockNumber} processed in ${((endTime - startTime) / 1000).toFixed(3)}s`);
    }
  });
};

crawler().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});

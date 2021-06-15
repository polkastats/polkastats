// @ts-check
const pino = require('pino');
const { BigNumber } = require('bignumber.js');
const {
  getClient,
  getPolkadotAPI,
  isNodeSynced,
  shortHash,
  storeExtrinsics,
  storeLogs,
  getDisplayName,
  wait,
} = require('../lib/utils');
const backendConfig = require('../backend.config');

const crawlerName = 'blockHarvester';
const logger = pino();
const loggerOptions = {
  crawler: crawlerName,
};
const config = backendConfig.crawlers.find(
  ({ name }) => name === crawlerName,
);

const harvestBlocks = async (api, client, startBlock, _endBlock) => {
  let endBlock = _endBlock;
  /* eslint-disable no-await-in-loop */
  while (endBlock >= startBlock) {
    const startTime = new Date().getTime();
    try {
      const blockHash = await api.rpc.chain.getBlockHash(endBlock);
      const [
        { block },
        blockEvents,
        blockHeader,
        totalIssuance,
        runtimeVersion,
        validatorCount,
        ChainCurrentIndex,
        ChainCurrentSlot,
        ChainEpochIndex,
        ChainGenesisSlot,
        ChainCurrentEra,
        chainElectionStatus,
        timestampMs,
      ] = await Promise.all([
        api.rpc.chain.getBlock(blockHash),
        api.query.system.events.at(blockHash),
        api.derive.chain.getHeader(blockHash),
        api.query.balances.totalIssuance.at(blockHash),
        api.rpc.state.getRuntimeVersion(blockHash),
        api.query.staking.validatorCount.at(blockHash),
        api.query.session.currentIndex.at(blockHash),
        api.query.babe.currentSlot.at(blockHash),
        api.query.babe.epochIndex.at(blockHash),
        api.query.babe.genesisSlot.at(blockHash),
        api.query.staking.currentEra.at(blockHash),
        api.query.electionProviderMultiPhase.currentPhase.at(blockHash),
        api.query.timestamp.now.at(blockHash),
      ]);

      const blockAuthor = blockHeader.author || '';
      const blockAuthorIdentity = await api.derive.accounts.info(blockHeader.author);
      const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
      const timestamp = Math.floor(timestampMs / 1000);
      const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;

      // Get election status
      const isElection = Object.getOwnPropertyNames(chainElectionStatus.toJSON())[0] !== 'off';

      // progress
      const currentEra = new BigNumber(ChainCurrentEra);
      const currentIndex = new BigNumber(ChainCurrentIndex);
      const currentSlot = new BigNumber(ChainCurrentSlot);
      const epochIndex = new BigNumber(ChainEpochIndex);
      const genesisSlot = new BigNumber(ChainGenesisSlot);
      const epochDuration = new BigNumber(api.consts.babe.epochDuration);
      const sessionsPerEra = new BigNumber(api.consts.staking.sessionsPerEra);
      const eraLength = epochDuration.multipliedBy(sessionsPerEra);
      const epochStartSlot = epochIndex.multipliedBy(epochDuration).plus(genesisSlot);
      const sessionProgress = currentSlot.minus(epochStartSlot);
      // We don't calculate eraProgress for harvested blocks
      const eraProgress = 0;

      // Store block events
      try {
        // eslint-disable-next-line no-loop-func
        blockEvents.forEach(async (record, index) => {
          const { event, phase } = record;
          const sql = `INSERT INTO event (
              block_number,
              event_index,
              section,
              method,
              phase,
              data,
              timestamp
            ) VALUES (
              '${endBlock}',
              '${index}',
              '${event.section}',
              '${event.method}',
              '${phase.toString()}',
              '${JSON.stringify(event.data)}',
              '${timestamp}'
            )
            ON CONFLICT ON CONSTRAINT event_pkey 
            DO NOTHING
            ;`;
          try {
            await client.query(sql);
            logger.info(loggerOptions, `Added event #${endBlock}-${index} ${event.section} ➡ ${event.method}`);
          } catch (error) {
            logger.error(loggerOptions, `Error adding event #${endBlock}-${index}: ${error}, sql: ${sql}`);
          }
        });
      } catch (error) {
        logger.error(loggerOptions, `Error getting events for block ${endBlock} (${blockHash}): ${error}`);
        const errorString = error.toString().replace(/'/g, "''");
        const sql = `INSERT INTO harvester_error (block_number, error, timestamp)
            VALUES ('${endBlock}', '${errorString}', '${timestamp}');
        `;
        await client.query(sql);
      }

      // Store block extrinsics
      try {
        await storeExtrinsics(
          api,
          client,
          endBlock,
          blockHash,
          block.extrinsics,
          blockEvents,
          timestamp,
          loggerOptions,
        );
      } catch (error) {
        logger.error(loggerOptions, `Error getting extrinsics for block ${endBlock} (${blockHash}): ${error}`);
        const errorString = error.toString().replace(/'/g, "''");
        const sql = `INSERT INTO harvester_error (block_number, error, timestamp)
          VALUES ('${endBlock}', '${errorString}', '${timestamp}');
        `;
        await client.query(sql);
      }

      // Store block logs
      await storeLogs(client, endBlock, blockHeader.digest.logs, loggerOptions);

      // Totals
      const totalEvents = blockEvents.length;
      const totalExtrinsics = block.extrinsics.length;

      const sqlInsert = `INSERT INTO block (
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
          '${endBlock}',
          false,
          '${blockAuthor}',
          '${blockAuthorName}',
          '${blockHash}',
          '${parentHash}',
          '${extrinsicsRoot}',
          '${stateRoot}',
          '${currentEra}',
          '${currentIndex}',
          '${eraLength}',
          '${eraProgress}',
          'true',
          '${isElection}',
          '${epochDuration}',
          '${sessionsPerEra}',
          '${sessionProgress}',
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
        await client.query(sqlInsert);
        const endTime = new Date().getTime();
        logger.info(loggerOptions, `Added block #${endBlock} (${shortHash(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(3)}s`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding block #${endBlock}: ${error}`);
      }
      endBlock -= 1;
    } catch (error) {
      logger.error(loggerOptions, `Error adding block #${endBlock}: ${error}`);
      const timestamp = new Date().getTime();
      const errorString = error.toString().replace(/'/g, "''");
      const sql = `INSERT INTO harvester_error (block_number, error, timestamp)
        VALUES ('${endBlock}', '${errorString}', '${timestamp}');
      `;
      await client.query(sql);
      endBlock -= 1;
    }
  }
};

const crawler = async () => {
  logger.info(loggerOptions, `Delaying block harvester crawler start for ${config.startDelay / 1000}s`);
  await wait(config.startDelay);

  logger.info(loggerOptions, 'Starting block harvester...');
  const startTime = new Date().getTime();
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
  // Get gaps from block table
  const sqlSelect = `
    SELECT
      gap_start, gap_end FROM (
        SELECT block_number + 1 AS gap_start,
        next_nr - 1 AS gap_end
        FROM (
          SELECT block_number, lead(block_number) OVER (ORDER BY block_number) AS next_nr
          FROM block
        ) nr
        WHERE nr.block_number + 1 <> nr.next_nr
      ) AS g
    UNION ALL (
      SELECT
        0 AS gap_start,
        block_number - 2 AS gap_end
      FROM
        block
      ORDER BY
        block_number
      ASC LIMIT 1
    )
    ORDER BY
      gap_end DESC
  `;
  const res = await client.query(sqlSelect);
  // eslint-disable-next-line no-restricted-syntax
  for (const row of res.rows) {
    // Quick fix for gap 0-0 error
    if (!(row.gap_start === 0 && row.gap_end === 0)) {
      logger.info(loggerOptions, `Detected gap! Harvesting blocks from #${row.gap_end} to #${row.gap_start}`);
      // eslint-disable-next-line no-await-in-loop
      await harvestBlocks(
        api,
        client,
        parseInt(row.gap_start, 10),
        parseInt(row.gap_end, 10),
      );
    }
  }
  logger.info(loggerOptions, 'Disconnecting from API');
  await api.disconnect().catch((error) => logger.error(loggerOptions, `Disconnect error: ${JSON.stringify(error)}`));
  // Log execution time
  const endTime = new Date().getTime();
  logger.info(loggerOptions, `Executed in ${((endTime - startTime) / 1000).toFixed(0)}s`);
  logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
  setTimeout(
    () => crawler(),
    config.pollingTime,
  );
};

crawler().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});

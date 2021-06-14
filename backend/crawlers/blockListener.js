// @ts-check
const pino = require('pino');
const {
  getClient,
  getPolkadotAPI,
  isNodeSynced,
  wait,
  shortHash,
  storeExtrinsics,
  storeEvents,
  getDisplayName,
  updateTotals,
  updateAccountsInfo,
} = require('../lib/utils.js');

const logger = pino();
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

    // Parallelize
    const [
      { block },
      extendedHeader,
      finalizedBlockHash,
      timestampMs,
    ] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      api.derive.chain.getHeader(blockHash),
      api.rpc.chain.getFinalizedHead(),
      api.query.timestamp.now.at(blockHash),
    ]);

    const finalizedBlockHeader = await api.rpc.chain.getHeader(finalizedBlockHash);
    const finalizedBlock = finalizedBlockHeader.number.toNumber();
    const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;

    // Handle chain reorganizations
    let sql = `SELECT block_number FROM block WHERE block_number = '${blockNumber}'`;
    let res = await client.query(sql);
    if (res.rows.length > 0) {
      // Chain reorganization detected! We need to update block_author, block_hash and state_root
      logger.info(loggerOptions, `Detected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root`);
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
      ] = await Promise.all([
        api.derive.accounts.info(blockAuthor),
        api.query.system.events.at(blockHash),
      ]);
      const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);

      // Totals
      const totalEvents = blockEvents.length || 0;
      const totalExtrinsics = block.extrinsics.length;

      // Store new block
      logger.info(loggerOptions, `Adding block #${blockNumber} (${shortHash(blockHash.toString())})`);
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
          total_events,
          total_extrinsics,
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
          '${totalEvents}',
          '${totalExtrinsics}',
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

      // Store block extrinsics
      await storeExtrinsics(
        client,
        blockNumber,
        block.extrinsics,
        blockEvents,
        timestamp,
        loggerOptions,
      );

      // Get involved addresses from block events and update its balances
      await updateAccountsInfo(
        api,
        client,
        blockNumber,
        timestamp,
        loggerOptions,
        blockEvents,
      );

      // Store module events
      await storeEvents(
        client,
        blockNumber,
        blockEvents,
        timestamp,
        loggerOptions,
      );

      // Update totals
      await updateTotals(client, finalizedBlock, loggerOptions);

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

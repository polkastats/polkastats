// @ts-check
const pino = require('pino');
const { BigNumber } = require('bignumber.js');
const {
  getPool,
  getPolkadotAPI,
  isNodeSynced,
  shortHash,
  storeExtrinsics,
  storeEvents,
  storeLogs,
  getDisplayName,
  wait,
} = require('../lib/utils');
const backendConfig = require('../backend.config');

const crawlerName = 'blockHarvester';
const logger = pino({
  level: backendConfig.logLevel,
});

const loggerOptions = {
  crawler: crawlerName,
};
const config = backendConfig.crawlers.find(
  ({ name }) => name === crawlerName,
);
const chunkSize = 20;
const statsPrecision = 2;

const chunker = (a, n) => Array.from(
  { length: Math.ceil(a.length / n) },
  (_, i) => a.slice(i * n, i * n + n),
);

const harvestBlock = async (api, pool, blockNumber) => {
  const startTime = new Date().getTime();
  try {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
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
    // Don't calculate eraProgress for harvested blocks
    const eraProgress = 0;

    // Store block extrinsics (async)
    storeExtrinsics(
      api,
      pool,
      blockNumber,
      blockHash,
      block.extrinsics,
      blockEvents,
      timestamp,
      loggerOptions,
    );
    // Store module events (async)
    storeEvents(
      pool,
      blockNumber,
      blockEvents,
      timestamp,
      loggerOptions,
    );
    // Store block logs (async)
    storeLogs(
      pool,
      blockNumber,
      blockHeader.digest.logs,
      timestamp,
      loggerOptions,
    );

    // Totals
    const totalEvents = blockEvents.length;
    const totalExtrinsics = block.extrinsics.length;

    const query = `INSERT INTO block (
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

    (async () => {
      const client = await pool.connect();
      try {
        await client.query(query);
        const endTime = new Date().getTime();
        logger.debug(loggerOptions, `Added block #${blockNumber} (${shortHash(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(statsPrecision)}s`);
      } finally {
        client.release();
      }
    })().catch((err) => logger.error(`Db error: ${err.stack}`));
  } catch (error) {
    logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
    const timestamp = new Date().getTime();
    const errorString = error.toString().replace(/'/g, "''");
    const query = `INSERT INTO harvester_error (block_number, error, timestamp)
      VALUES ('${blockNumber}', '${errorString}', '${timestamp}');
    `;
    (async () => {
      const client = await pool.connect();
      try {
        await client.query(query);
      } finally {
        client.release();
      }
    })().catch((err) => logger.error(`Db error: ${err.stack}`));
  }
};

// Return a reverse ordered array from range
const range = (start, stop, step) => Array
  .from({ length: (stop - start) / step + 1 }, (_, i) => stop - (i * step));

const harvestBlocks = async (api, pool, startBlock, endBlock) => {
  if (startBlock === endBlock) {
    logger.debug(loggerOptions, `Processing block #${startBlock}`);
    await harvestBlock(api, pool, startBlock);
    return;
  }
  const blocks = range(startBlock, endBlock, 1);
  const chunks = chunker(blocks, chunkSize);
  logger.info(loggerOptions, `Processing chunks of ${chunkSize} blocks`);

  const chunkProcessingTimes = [];
  let maxTimeMs = 0;
  let minTimeMs = 1000000;
  let avgTimeMs = 0;
  let avgBlocksPerSecond = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const chunk of chunks) {
    const chunkStartTime = Date.now();
    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      chunk.map(
        (blockNumber) => harvestBlock(api, pool, blockNumber),
      ),
    );
    const chunkEndTime = new Date().getTime();

    // Cook some stats
    const chunkProcessingTimeMs = chunkEndTime - chunkStartTime;
    if (chunkProcessingTimeMs < minTimeMs) {
      minTimeMs = chunkProcessingTimeMs;
    }
    if (chunkProcessingTimeMs > maxTimeMs) {
      maxTimeMs = chunkProcessingTimeMs;
    }
    chunkProcessingTimes.push(chunkProcessingTimeMs);
    avgTimeMs = chunkProcessingTimes.reduce(
      (sum, chunkProcessingTime) => sum + chunkProcessingTime, 0,
    ) / chunkProcessingTimes.length;
    avgBlocksPerSecond = 1 / ((avgTimeMs / 1000) / chunkSize);
    const currentBlocksPerSecond = 1 / ((chunkProcessingTimeMs / 1000) / chunkSize);
    const completed = ((chunks.indexOf(chunk) + 1) * 100) / chunks.length;

    logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} [${completed.toFixed(statsPrecision)}%] in ${((chunkProcessingTimeMs) / 1000).toFixed(statsPrecision)}s min/max/avg: ${(minTimeMs / 1000).toFixed(statsPrecision)}/${(maxTimeMs / 1000).toFixed(statsPrecision)}/${(avgTimeMs / 1000).toFixed(statsPrecision)} cur/avg block/s: ${currentBlocksPerSecond.toFixed(statsPrecision)}/${avgBlocksPerSecond.toFixed(statsPrecision)}`);
  }
};

const crawler = async () => {
  logger.info(loggerOptions, `Delaying block harvester crawler start for ${config.startDelay / 1000}s`);
  await wait(config.startDelay);

  logger.info(loggerOptions, 'Starting block harvester...');
  const startTime = new Date().getTime();
  const pool = getPool(loggerOptions);

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
  // Thanks to @miguelmota: https://gist.github.com/miguelmota/6d40be2ecb083507de1d073443154610
  const query = `
    SELECT
      gap_start, gap_end FROM (
        SELECT
          block_number + 1 AS gap_start,
          next_nr - 1 AS gap_end
        FROM (
          SELECT block_number, lead(block_number) OVER (ORDER BY block_number) AS next_nr
          FROM block
        ) nr
        WHERE nr.block_number + 1 <> nr.next_nr
    ) AS g UNION ALL (
      SELECT
        0 AS gap_start,
        block_number AS gap_end
      FROM
        block
      ORDER BY
        block_number ASC
      LIMIT 1
    )
    ORDER BY gap_start DESC
  `;
  let rows = [];
  (async () => {
    const client = await pool.connect();
    try {
      const res = await client.query(query);
      rows = res.rows;
    } finally {
      client.release();
    }
  })().catch((err) => logger.error(`Db error: ${err.stack}`));

  // eslint-disable-next-line no-restricted-syntax
  for (const row of rows) {
    // Quick fix for gap 0-0 error
    if (!(row.gap_start === 0 && row.gap_end === 0)) {
      logger.info(loggerOptions, `Detected gap! Harvesting blocks from #${row.gap_end} to #${row.gap_start}`);
      // eslint-disable-next-line no-await-in-loop
      await harvestBlocks(
        api,
        pool,
        parseInt(row.gap_start, 10),
        parseInt(row.gap_end, 10),
      );
    }
  }
  logger.debug(loggerOptions, 'Disconnecting from API');
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

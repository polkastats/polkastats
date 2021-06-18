// @ts-check
const pino = require('pino');
const {
  getClient,
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

// possible values 'chunks' or 'seq'
const harvestMode = 'chunks';
const chunkSize = 10;
const statsPrecision = 2;

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

// Return a reverse ordered array from range
const range = (start, stop, step) => Array
  .from({ length: (stop - start) / step + 1 }, (_, i) => stop - (i * step));

const chunker = (a, n) => Array.from(
  { length: Math.ceil(a.length / n) },
  (_, i) => a.slice(i * n, i * n + n),
);

const harvestBlock = async (api, client, blockNumber) => {
  const startTime = new Date().getTime();
  try {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const [
      { block },
      blockEvents,
      blockHeader,
      totalIssuance,
      runtimeVersion,
      chainActiveEra,
      currentIndex,
      chainElectionStatus,
      timestampMs,
    ] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      api.query.system.events.at(blockHash),
      api.derive.chain.getHeader(blockHash),
      api.query.balances.totalIssuance.at(blockHash),
      api.rpc.state.getRuntimeVersion(blockHash),
      api.query.staking.activeEra.at(blockHash),
      api.query.session.currentIndex.at(blockHash),
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
    const activeEra = chainActiveEra.toJSON().index.toString();

    // Store block extrinsics (async)
    storeExtrinsics(
      api,
      client,
      blockNumber,
      blockHash,
      block.extrinsics,
      blockEvents,
      timestamp,
      loggerOptions,
    );
    // Store module events (async)
    storeEvents(
      client,
      blockNumber,
      blockEvents,
      timestamp,
      loggerOptions,
    );
    // Store block logs (async)
    storeLogs(
      client,
      blockNumber,
      blockHeader.digest.logs,
      timestamp,
      loggerOptions,
    );

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
        active_era,
        current_index,
        is_election,
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
        '${activeEra}',
        '${currentIndex}',
        '${isElection}',
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
      logger.debug(loggerOptions, `Added block #${blockNumber} (${shortHash(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(statsPrecision)}s`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
    }
  } catch (error) {
    logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
    const timestamp = new Date().getTime();
    const errorString = error.toString().replace(/'/g, "''");
    const sql = `INSERT INTO harvester_error (block_number, error, timestamp)
      VALUES ('${blockNumber}', '${errorString}', '${timestamp}');
    `;
    await client.query(sql);
  }
};

// eslint-disable-next-line no-unused-vars
const harvestBlocksSeq = async (api, client, startBlock, endBlock) => {
  const blocks = range(startBlock, endBlock, 1);
  const blockProcessingTimes = [];
  let maxTimeMs = 0;
  let minTimeMs = 1000000;
  let avgTimeMs = 0;

  // eslint-disable-next-line no-restricted-syntax
  for (const blockNumber of blocks) {
    const blockStartTime = Date.now();
    // eslint-disable-next-line no-await-in-loop
    await harvestBlock(api, client, blockNumber);
    const blockEndTime = new Date().getTime();

    // Cook some stats
    const blockProcessingTimeMs = blockEndTime - blockStartTime;
    if (blockProcessingTimeMs < minTimeMs) {
      minTimeMs = blockProcessingTimeMs;
    }
    if (blockProcessingTimeMs > maxTimeMs) {
      maxTimeMs = blockProcessingTimeMs;
    }
    blockProcessingTimes.push(blockProcessingTimeMs);
    avgTimeMs = blockProcessingTimes.reduce(
      (sum, blockProcessingTime) => sum + blockProcessingTime, 0,
    ) / blockProcessingTimes.length;
    const completed = ((blocks.indexOf(blockNumber) + 1) * 100) / blocks.length;

    logger.info(loggerOptions, `Processed block #${blockNumber} ${blocks.indexOf(blockNumber) + 1}/${blocks.length} [${completed.toFixed(statsPrecision)}%] in ${((blockProcessingTimeMs) / 1000).toFixed(statsPrecision)}s min/max/avg: ${(minTimeMs / 1000).toFixed(statsPrecision)}/${(maxTimeMs / 1000).toFixed(statsPrecision)}/${(avgTimeMs / 1000).toFixed(statsPrecision)}`);
  }
};

const harvestBlocks = async (api, client, startBlock, endBlock) => {
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
        (blockNumber) => harvestBlock(api, client, blockNumber),
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
  const client = await getClient(loggerOptions);
  const api = await getPolkadotAPI(loggerOptions);
  await api.isReady;
  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    // eslint-disable-next-line no-await-in-loop
    await wait(10000);
    // eslint-disable-next-line no-await-in-loop
    synced = await isNodeSynced(api, loggerOptions);
  }
  // Get gaps from block table
  // Thanks to @miguelmota: https://gist.github.com/miguelmota/6d40be2ecb083507de1d073443154610
  const sqlSelect = `
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
  const res = await client.query(sqlSelect);
  // eslint-disable-next-line no-restricted-syntax
  for (const row of res.rows) {
    logger.info(loggerOptions, `Detected gap! Harvesting blocks from #${row.gap_end} to #${row.gap_start}`);
    if (harvestMode === 'chunks') {
      // eslint-disable-next-line no-await-in-loop
      await harvestBlocks(
        api,
        client,
        parseInt(row.gap_start, 10),
        parseInt(row.gap_end, 10),
      );
    } else {
      // eslint-disable-next-line no-await-in-loop
      await harvestBlocksSeq(
        api,
        client,
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

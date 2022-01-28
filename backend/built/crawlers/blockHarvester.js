"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check
const pino_1 = __importDefault(require("pino"));
const utils_1 = require("../lib/utils");
const backend_config_1 = require("../backend.config");
const crawlerName = 'blockHarvester';
const logger = (0, pino_1.default)({
    level: backend_config_1.backendConfig.logLevel,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
// Return a reverse ordered array from range
const range = (start, stop, step) => Array
    .from({ length: (stop - start) / step + 1 }, (_, i) => stop - (i * step));
const chunker = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const healthCheck = (client) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    logger.info(loggerOptions, 'Starting health check');
    const query = `
    SELECT
      b.block_number,
      b.total_events,
      (SELECT COUNT(*) FROM event AS ev WHERE ev.block_number = b.block_number) AS table_total_events,
      b.total_extrinsics,
      (SELECT COUNT(*) FROM extrinsic AS ex WHERE ex.block_number = b.block_number) table_total_extrinsics
    FROM
      block AS b
    WHERE
      b.total_events > (SELECT COUNT(*) FROM event AS ev WHERE ev.block_number = b.block_number)
    OR
      b.total_extrinsics > (SELECT COUNT(*) FROM extrinsic AS ex WHERE ex.block_number = b.block_number) 
    ;`;
    const res = yield (0, utils_1.dbQuery)(client, query, loggerOptions);
    // eslint-disable-next-line no-restricted-syntax
    for (const row of res.rows) {
        logger.info(loggerOptions, `Health check failed for block #${row.block_number}, deleting block from block table!`);
        // eslint-disable-next-line no-await-in-loop
        yield (0, utils_1.dbQuery)(client, `DELETE FROM block WHERE block_number = '${row.block_number}';`, loggerOptions);
    }
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Health check finished in ${((endTime - startTime) / 1000).toFixed(config.statsPrecision)}s`);
});
const harvestBlock = (api, client, blockNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    try {
        const blockHash = yield api.rpc.chain.getBlockHash(blockNumber);
        const [{ block }, blockEvents, blockHeader, totalIssuance, runtimeVersion, activeEra, currentIndex, chainElectionStatus, timestampMs,] = yield Promise.all([
            api.rpc.chain.getBlock(blockHash),
            api.query.system.events.at(blockHash),
            api.derive.chain.getHeader(blockHash),
            api.query.balances.totalIssuance.at(blockHash),
            api.rpc.state.getRuntimeVersion(blockHash),
            api.query.staking.activeEra.at(blockHash)
                .then((res) => (res.toJSON() ? res.toJSON().index : 0)),
            api.query.session.currentIndex.at(blockHash)
                .then((res) => (res || 0)),
            api.query.electionProviderMultiPhase.currentPhase.at(blockHash),
            api.query.timestamp.now.at(blockHash),
        ]);
        const blockAuthor = blockHeader.author || '';
        const blockAuthorIdentity = yield api.derive.accounts.info(blockHeader.author);
        const blockAuthorName = (0, utils_1.getDisplayName)(blockAuthorIdentity.identity);
        const timestamp = Math.floor(timestampMs / 1000);
        const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;
        // Get election status
        const isElection = Object.getOwnPropertyNames(chainElectionStatus.toJSON())[0] !== 'off';
        // Store block extrinsics (async)
        (0, utils_1.processExtrinsics)(api, client, blockNumber, blockHash, block.extrinsics, blockEvents, timestamp, loggerOptions);
        // Store module events (async)
        (0, utils_1.processEvents)(client, blockNumber, blockEvents, timestamp, loggerOptions);
        // Store block logs (async)
        (0, utils_1.processLogs)(client, blockNumber, blockHeader.digest.logs, timestamp, loggerOptions);
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
            yield (0, utils_1.dbQuery)(client, sqlInsert, loggerOptions);
            const endTime = new Date().getTime();
            logger.debug(loggerOptions, `Added block #${blockNumber} (${(0, utils_1.shortHash)(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(config.statsPrecision)}s`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
        }
    }
    catch (error) {
        logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
        yield (0, utils_1.logHarvestError)(client, blockNumber, error, loggerOptions);
    }
});
// eslint-disable-next-line no-unused-vars
const harvestBlocksSeq = (api, client, startBlock, endBlock) => __awaiter(void 0, void 0, void 0, function* () {
    const blocks = range(startBlock, endBlock, 1);
    const blockProcessingTimes = [];
    let maxTimeMs = 0;
    let minTimeMs = 1000000;
    let avgTimeMs = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const blockNumber of blocks) {
        const blockStartTime = Date.now();
        // eslint-disable-next-line no-await-in-loop
        yield harvestBlock(api, client, blockNumber);
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
        avgTimeMs = blockProcessingTimes.reduce((sum, blockProcessingTime) => sum + blockProcessingTime, 0) / blockProcessingTimes.length;
        const completed = ((blocks.indexOf(blockNumber) + 1) * 100) / blocks.length;
        logger.info(loggerOptions, `Processed block #${blockNumber} ${blocks.indexOf(blockNumber) + 1}/${blocks.length} [${completed.toFixed(config.statsPrecision)}%] in ${((blockProcessingTimeMs) / 1000).toFixed(config.statsPrecision)}s min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)}`);
    }
});
const harvestBlocks = (api, client, startBlock, endBlock) => __awaiter(void 0, void 0, void 0, function* () {
    const blocks = range(startBlock, endBlock, 1);
    const chunks = chunker(blocks, config.chunkSize);
    logger.info(loggerOptions, `Processing chunks of ${config.chunkSize} blocks`);
    const chunkProcessingTimes = [];
    let maxTimeMs = 0;
    let minTimeMs = 1000000;
    let avgTimeMs = 0;
    let avgBlocksPerSecond = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const chunk of chunks) {
        const chunkStartTime = Date.now();
        // eslint-disable-next-line no-await-in-loop
        yield Promise.all(chunk.map((blockNumber) => harvestBlock(api, client, blockNumber)));
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
        avgTimeMs = chunkProcessingTimes.reduce((sum, chunkProcessingTime) => sum + chunkProcessingTime, 0) / chunkProcessingTimes.length;
        avgBlocksPerSecond = 1 / ((avgTimeMs / 1000) / config.chunkSize);
        const currentBlocksPerSecond = 1 / ((chunkProcessingTimeMs / 1000) / config.chunkSize);
        const completed = ((chunks.indexOf(chunk) + 1) * 100) / chunks.length;
        logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} [${completed.toFixed(config.statsPrecision)}%] `
            + `in ${((chunkProcessingTimeMs) / 1000).toFixed(config.statsPrecision)}s `
            + `min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)} `
            + `cur/avg block/s: ${currentBlocksPerSecond.toFixed(config.statsPrecision)}/${avgBlocksPerSecond.toFixed(config.statsPrecision)}`);
    }
});
const crawler = (delayedStart) => __awaiter(void 0, void 0, void 0, function* () {
    if (delayedStart) {
        logger.info(loggerOptions, `Delaying block harvester crawler start for ${config.startDelay / 1000}s`);
        yield (0, utils_1.wait)(config.startDelay);
    }
    logger.info(loggerOptions, 'Starting block harvester...');
    const startTime = new Date().getTime();
    const client = yield (0, utils_1.getClient)(loggerOptions);
    // Delete blocks that don't have all its events or extrinsics in db
    yield healthCheck(client);
    const api = yield (0, utils_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = yield (0, utils_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        // eslint-disable-next-line no-await-in-loop
        yield (0, utils_1.wait)(10000);
        // eslint-disable-next-line no-await-in-loop
        synced = yield (0, utils_1.isNodeSynced)(api, loggerOptions);
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
    const res = yield (0, utils_1.dbQuery)(client, sqlSelect, loggerOptions);
    // eslint-disable-next-line no-restricted-syntax
    for (const row of res.rows) {
        if (!(row.gap_start === 0 && row.gap_end === 0)) {
            logger.info(loggerOptions, `Detected gap! Harvesting blocks from #${row.gap_end} to #${row.gap_start}`);
            if (config.mode === 'chunks') {
                // eslint-disable-next-line no-await-in-loop
                yield harvestBlocks(api, client, parseInt(row.gap_start, 10), parseInt(row.gap_end, 10));
            }
            else {
                // eslint-disable-next-line no-await-in-loop
                yield harvestBlocksSeq(api, client, parseInt(row.gap_start, 10), parseInt(row.gap_end, 10));
            }
        }
    }
    logger.debug(loggerOptions, 'Disconnecting from API');
    yield api.disconnect().catch((error) => logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`));
    logger.debug(loggerOptions, 'Disconnecting from DB');
    yield client.end().catch((error) => logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`));
    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Executed in ${((endTime - startTime) / 1000).toFixed(0)}s`);
    logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
    setTimeout(() => crawler(false), config.pollingTime);
});
crawler(true).catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(-1);
});
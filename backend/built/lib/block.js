"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFinalizedBlock = exports.harvestBlocks = exports.harvestBlocksSeq = exports.harvestBlock = exports.storeMetadata = exports.healthCheck = exports.logHarvestError = exports.updateFinalized = exports.getDisplayName = void 0;
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
const db_1 = require("./db");
const backend_config_1 = require("../backend.config");
const logger_1 = require("./logger");
const log_1 = require("./log");
const event_1 = require("./event");
const extrinsic_1 = require("./extrinsic");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const getDisplayName = (identity) => {
    if (identity.displayParent &&
        identity.displayParent !== '' &&
        identity.display &&
        identity.display !== '') {
        return `${identity.displayParent} / ${identity.display}`;
    }
    return identity.display || '';
};
exports.getDisplayName = getDisplayName;
const updateFinalized = async (client, finalizedBlock, loggerOptions) => {
    const sql = `
    UPDATE block SET finalized = true WHERE finalized = false AND block_number <= $1;
  `;
    try {
        await client.query(sql, [finalizedBlock]);
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
        Sentry.captureException(error);
    }
};
exports.updateFinalized = updateFinalized;
const logHarvestError = async (client, blockNumber, error, loggerOptions) => {
    const timestamp = new Date().getTime();
    const errorString = error.toString().replace(/'/g, "''");
    const data = [blockNumber, errorString, timestamp];
    const query = `
    INSERT INTO
      harvest_error (block_number, error, timestamp)
    VALUES
      ($1, $2, $3)
    ON CONFLICT ON CONSTRAINT
      harvest_error_pkey 
      DO NOTHING
    ;`;
    await (0, db_1.dbParamQuery)(client, query, data, loggerOptions);
};
exports.logHarvestError = logHarvestError;
const healthCheck = async (config, client, loggerOptions) => {
    const startTime = new Date().getTime();
    logger_1.logger.info(loggerOptions, 'Starting health check');
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
    const res = await (0, db_1.dbQuery)(client, query, loggerOptions);
    for (const row of res.rows) {
        logger_1.logger.info(loggerOptions, `Health check failed for block #${row.block_number}, deleting block from block table!`);
        await (0, db_1.dbQuery)(client, `DELETE FROM block WHERE block_number = '${row.block_number}';`, loggerOptions);
    }
    const endTime = new Date().getTime();
    logger_1.logger.debug(loggerOptions, `Health check finished in ${((endTime - startTime) / 1000).toFixed(config.statsPrecision)}s`);
};
exports.healthCheck = healthCheck;
const storeMetadata = async (client, blockNumber, blockHash, specName, specVersion, timestamp, loggerOptions) => {
    let metadata;
    try {
        const response = await axios_1.default.get(`${backend_config_1.backendConfig.substrateApiSidecar}/runtime/metadata?at=${blockHash}`);
        metadata = response.data;
        logger_1.logger.debug(loggerOptions, `Got runtime metadata at ${blockHash}!`);
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error fetching runtime metadata at ${blockHash}: ${JSON.stringify(error)}`);
        const scope = new Sentry.Scope();
        scope.setTag('blockNumber', blockNumber);
        Sentry.captureException(error, scope);
    }
    const data = [
        blockNumber,
        specName,
        specVersion,
        Object.keys(metadata.metadata)[0],
        metadata.magicNumber,
        metadata.metadata,
        timestamp,
    ];
    const query = `
    INSERT INTO runtime (
      block_number,
      spec_name,
      spec_version,
      metadata_version,
      metadata_magic_number,
      metadata,
      timestamp
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7
    )
    ON CONFLICT (spec_version)
    DO UPDATE SET
      block_number = EXCLUDED.block_number
    WHERE EXCLUDED.block_number < runtime.block_number;`;
    await (0, db_1.dbParamQuery)(client, query, data, loggerOptions);
};
exports.storeMetadata = storeMetadata;
const harvestBlock = async (config, api, client, blockNumber, loggerOptions) => {
    const startTime = new Date().getTime();
    try {
        const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
        const apiAt = await api.at(blockHash);
        const [{ block }, blockEvents, blockHeader, totalIssuance, runtimeVersion, activeEra, currentIndex, chainElectionStatus, timestamp,] = await Promise.all([
            api.rpc.chain.getBlock(blockHash),
            apiAt.query.system.events(),
            api.derive.chain.getHeader(blockHash),
            apiAt.query.balances.totalIssuance(),
            api.rpc.state.getRuntimeVersion(blockHash),
            apiAt.query.staking
                .activeEra()
                .then((res) => (res.toJSON() ? res.toJSON().index : 0))
                .catch((e) => {
                console.log(e);
                return 0;
            }),
            apiAt.query.session.currentIndex().then((res) => res || 0),
            apiAt.query.electionProviderMultiPhase.currentPhase(),
            apiAt.query.timestamp.now(),
        ]);
        const blockAuthor = blockHeader.author || '';
        const blockAuthorIdentity = await api.derive.accounts.info(blockHeader.author);
        const blockAuthorName = (0, exports.getDisplayName)(blockAuthorIdentity.identity);
        const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;
        // Get election status
        const isElection = Object.getOwnPropertyNames(chainElectionStatus.toJSON())[0] !== 'off';
        // Totals
        const totalEvents = blockEvents.length;
        const totalExtrinsics = block.extrinsics.length;
        const data = [
            blockNumber,
            false,
            blockAuthor.toString(),
            blockAuthorName,
            blockHash.toString(),
            parentHash.toString(),
            extrinsicsRoot.toString(),
            stateRoot.toString(),
            activeEra,
            currentIndex,
            isElection,
            runtimeVersion.specVersion,
            totalEvents,
            totalExtrinsics,
            totalIssuance.toString(),
            timestamp,
        ];
        const sql = `INSERT INTO block (
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
        spec_version,
        total_events,
        total_extrinsics,
        total_issuance,
        timestamp
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16
      )
      ON CONFLICT ON CONSTRAINT block_pkey 
      DO NOTHING
      ;`;
        try {
            await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
            const endTime = new Date().getTime();
            logger_1.logger.info(loggerOptions, `Added block #${blockNumber} (${(0, utils_1.shortHash)(blockHash.toString())}) in ${((endTime - startTime) /
                1000).toFixed(config.statsPrecision)}s`);
        }
        catch (error) {
            logger_1.logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
            const scope = new Sentry.Scope();
            scope.setTag('blockNumber', blockNumber);
            Sentry.captureException(error, scope);
        }
        // Runtime upgrade
        const runtimeUpgrade = blockEvents.find(({ event }) => apiAt.events.system.CodeUpdated.is(event));
        if (runtimeUpgrade) {
            const specName = runtimeVersion.toJSON().specName;
            const specVersion = runtimeVersion.specVersion;
            // TODO: enable again
            // see: https://github.com/polkadot-js/api/issues/4596
            // const metadata = await api.rpc.state.getMetadata(blockHash);
            await (0, exports.storeMetadata)(client, blockNumber, blockHash.toString(), specName.toString(), specVersion.toNumber(), timestamp.toNumber(), loggerOptions);
        }
        await Promise.all([
            // Store block extrinsics
            (0, extrinsic_1.processExtrinsics)(api, apiAt, client, blockNumber, blockHash, block.extrinsics, blockEvents, timestamp.toNumber(), loggerOptions),
            // Store module events
            (0, event_1.processEvents)(client, blockNumber, parseInt(activeEra.toString()), blockEvents, block.extrinsics, timestamp.toNumber(), loggerOptions),
            // Store block logs
            (0, log_1.processLogs)(client, blockNumber, blockHeader.digest.logs, timestamp.toNumber(), loggerOptions),
        ]);
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
        await (0, exports.logHarvestError)(client, blockNumber, error, loggerOptions);
        const scope = new Sentry.Scope();
        scope.setTag('blockNumber', blockNumber);
        Sentry.captureException(error, scope);
    }
};
exports.harvestBlock = harvestBlock;
// eslint-disable-next-line no-unused-vars
const harvestBlocksSeq = async (config, api, client, startBlock, endBlock, loggerOptions) => {
    const reverseOrder = true;
    const blocks = reverseOrder
        ? (0, utils_1.reverseRange)(startBlock, endBlock, 1)
        : (0, utils_1.range)(startBlock, endBlock, 1);
    const blockProcessingTimes = [];
    let maxTimeMs = 0;
    let minTimeMs = 1000000;
    let avgTimeMs = 0;
    for (const blockNumber of blocks) {
        const blockStartTime = Date.now();
        await (0, exports.harvestBlock)(config, api, client, blockNumber, loggerOptions);
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
        avgTimeMs =
            blockProcessingTimes.reduce((sum, blockProcessingTime) => sum + blockProcessingTime, 0) / blockProcessingTimes.length;
        const completed = ((blocks.indexOf(blockNumber) + 1) * 100) / blocks.length;
        logger_1.logger.info(loggerOptions, `Processed block #${blockNumber} ${blocks.indexOf(blockNumber) + 1}/${blocks.length} [${completed.toFixed(config.statsPrecision)}%] in ${(blockProcessingTimeMs / 1000).toFixed(config.statsPrecision)}s min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)}`);
    }
};
exports.harvestBlocksSeq = harvestBlocksSeq;
const harvestBlocks = async (config, api, client, startBlock, endBlock, loggerOptions) => {
    const reverseOrder = true;
    const blocks = reverseOrder
        ? (0, utils_1.reverseRange)(startBlock, endBlock, 1)
        : (0, utils_1.range)(startBlock, endBlock, 1);
    const chunks = (0, utils_1.chunker)(blocks, config.chunkSize);
    logger_1.logger.info(loggerOptions, `Processing chunks of ${config.chunkSize} blocks`);
    const chunkProcessingTimes = [];
    let maxTimeMs = 0;
    let minTimeMs = 1000000;
    let avgTimeMs = 0;
    let avgBlocksPerSecond = 0;
    for (const chunk of chunks) {
        const chunkStartTime = Date.now();
        await Promise.all(chunk.map((blockNumber) => (0, exports.harvestBlock)(config, api, client, blockNumber, loggerOptions)));
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
        avgTimeMs =
            chunkProcessingTimes.reduce((sum, chunkProcessingTime) => sum + chunkProcessingTime, 0) / chunkProcessingTimes.length;
        avgBlocksPerSecond = 1 / (avgTimeMs / 1000 / config.chunkSize);
        const currentBlocksPerSecond = 1 / (chunkProcessingTimeMs / 1000 / config.chunkSize);
        const completed = ((chunks.indexOf(chunk) + 1) * 100) / chunks.length;
        logger_1.logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} [${completed.toFixed(config.statsPrecision)}%] ` +
            `in ${(chunkProcessingTimeMs / 1000).toFixed(config.statsPrecision)}s ` +
            `min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)} ` +
            `cur/avg bps: ${currentBlocksPerSecond.toFixed(config.statsPrecision)}/${avgBlocksPerSecond.toFixed(config.statsPrecision)}`);
    }
};
exports.harvestBlocks = harvestBlocks;
const updateFinalizedBlock = async (api, client, blockNumber, loggerOptions) => {
    const startTime = new Date().getTime();
    try {
        const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
        const extendedHeader = await api.derive.chain.getHeader(blockHash);
        const { parentHash, extrinsicsRoot, stateRoot } = extendedHeader;
        const blockAuthorIdentity = await api.derive.accounts.info(extendedHeader.author);
        const blockAuthorName = (0, exports.getDisplayName)(blockAuthorIdentity.identity);
        const data = [
            extendedHeader.author,
            blockAuthorName,
            blockHash,
            parentHash,
            extrinsicsRoot,
            stateRoot,
            blockNumber,
        ];
        const sql = `UPDATE
        block SET block_author = $1,
        block_author_name = $2,
        block_hash = $3,
        parent_hash = $4,
        extrinsics_root = $5,
        state_root = $6
      WHERE block_number = $7`;
        await (0, db_1.dbParamQuery)(client, sql, data, loggerOptions);
        // Update finalized blocks
        await (0, exports.updateFinalized)(client, blockNumber, loggerOptions);
        const endTime = new Date().getTime();
        logger_1.logger.info(loggerOptions, `Updated finalized block #${blockNumber} (${(0, utils_1.shortHash)(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(3)}s`);
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error updating finalized block #${blockNumber}: ${error}`);
        Sentry.captureException(error);
    }
};
exports.updateFinalizedBlock = updateFinalizedBlock;

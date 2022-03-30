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
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const db_1 = require("../lib/db");
const chain_1 = require("../lib/chain");
const block_1 = require("../lib/block");
const utils_1 = require("../lib/utils");
const backend_config_1 = require("../backend.config");
const logger_1 = require("../lib/logger");
const crawlerName = 'blockListener';
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
const crawler = async () => {
    logger_1.logger.info(loggerOptions, 'Starting block listener...');
    const client = await (0, db_1.getClient)(loggerOptions);
    const api = await (0, chain_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        await (0, utils_1.wait)(10000);
        synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    }
    // update accounts info for addresses found on block events data
    const doUpdateAccountsInfo = true;
    // Subscribe to new blocks
    let iteration = 0;
    let trackedFinalizedBlock = 0;
    let initTracking = true;
    await api.rpc.chain.subscribeNewHeads(async (blockHeader) => {
        iteration++;
        const blockNumber = blockHeader.number.toNumber();
        const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
        try {
            await (0, block_1.harvestBlock)(config, api, client, blockNumber, doUpdateAccountsInfo, loggerOptions);
            // store current runtime metadata in first iteration
            if (iteration === 1) {
                const runtimeVersion = await api.rpc.state.getRuntimeVersion(blockHash);
                const apiAt = await api.at(blockHash);
                const timestamp = await apiAt.query.timestamp.now();
                const specName = runtimeVersion.toJSON().specName;
                const specVersion = runtimeVersion.specVersion;
                await (0, block_1.storeMetadata)(client, blockNumber, blockHash.toString(), specName.toString(), specVersion.toNumber(), timestamp.toNumber(), loggerOptions);
            }
        }
        catch (error) {
            logger_1.logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
            Sentry.captureException(error);
        }
        // track block finalization
        const finalizedBlockHash = await api.rpc.chain.getFinalizedHead();
        const { block: finalizedBlock } = await api.rpc.chain.getBlock(finalizedBlockHash);
        const finalizedBlockNumber = finalizedBlock.header.number.toNumber();
        if (initTracking) {
            trackedFinalizedBlock = finalizedBlockNumber;
            initTracking = false;
        }
        // handle missing finalized blocks from subscription
        if (trackedFinalizedBlock < finalizedBlockNumber) {
            for (let blockToUpdate = trackedFinalizedBlock + 1; blockToUpdate <= finalizedBlockNumber; blockToUpdate++) {
                await (0, block_1.updateFinalizedBlock)(config, api, client, blockToUpdate, loggerOptions);
            }
        }
        trackedFinalizedBlock = finalizedBlockNumber;
        // end track block finalization
    });
};
crawler().catch((error) => {
    logger_1.logger.error(loggerOptions, `Crawler error: ${error}`);
    Sentry.captureException(error);
    process.exit(-1);
});

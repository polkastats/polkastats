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
const crawlerName = 'blockFinalizer';
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
const crawler = async () => {
    logger_1.logger.info(loggerOptions, `Delaying block finalizer start for ${config.startDelay / 1000}s`);
    await (0, utils_1.wait)(config.startDelay);
    logger_1.logger.info(loggerOptions, 'Starting block finalizer...');
    const client = await (0, db_1.getClient)(loggerOptions);
    const api = await (0, chain_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        await (0, utils_1.wait)(10000);
        synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    }
    // Subscribe to finalized blocks
    let trackedBlock = 0;
    let initTracking = true;
    await api.rpc.chain.subscribeFinalizedHeads(async (blockHeader) => {
        const blockNumber = blockHeader.number.toNumber();
        if (initTracking) {
            trackedBlock = blockNumber;
            initTracking = false;
        }
        // Handle missing blocks from subscription
        for (let blockToUpdate = trackedBlock + 1; blockToUpdate <= blockNumber; blockToUpdate++) {
            await (0, block_1.updateFinalizedBlock)(api, client, blockToUpdate, loggerOptions);
        }
        trackedBlock = blockNumber;
    });
};
crawler().catch((error) => {
    logger_1.logger.error(loggerOptions, `Crawler error: ${error}`);
    Sentry.captureException(error);
    process.exit(-1);
});

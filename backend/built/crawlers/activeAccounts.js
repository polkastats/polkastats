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
const account_1 = require("../lib/account");
const utils_1 = require("../lib/utils");
const backend_config_1 = require("../backend.config");
const logger_1 = require("../lib/logger");
const crawlerName = 'activeAccounts';
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
const { chunkSize } = config;
const crawler = async (delayedStart) => {
    if (delayedStart && config.startDelay) {
        logger_1.logger.debug(loggerOptions, `Delaying active accounts crawler start for ${config.startDelay / 1000}s`);
        await (0, utils_1.wait)(config.startDelay);
    }
    logger_1.logger.debug(loggerOptions, 'Running active accounts crawler...');
    const client = await (0, db_1.getClient)(loggerOptions);
    const api = await (0, chain_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        await (0, utils_1.wait)(10000);
        synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    }
    const startTime = new Date().getTime();
    const accountIds = await (0, account_1.fetchAccountIds)(api);
    logger_1.logger.info(loggerOptions, `Got ${accountIds.length} active accounts`);
    const chunks = (0, utils_1.chunker)(accountIds, chunkSize);
    logger_1.logger.info(loggerOptions, `Processing chunks of ${chunkSize} accounts`);
    for (const chunk of chunks) {
        const chunkStartTime = Date.now();
        await Promise.all(chunk.map((accountId) => (0, account_1.processAccountsChunk)(api, client, accountId, loggerOptions)));
        const chunkEndTime = new Date().getTime();
        logger_1.logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} in ${((chunkEndTime - chunkStartTime) /
            1000).toFixed(3)}s`);
    }
    logger_1.logger.debug(loggerOptions, 'Disconnecting from API');
    await api.disconnect().catch((error) => {
        logger_1.logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    });
    logger_1.logger.debug(loggerOptions, 'Disconnecting from DB');
    await client.end().catch((error) => {
        logger_1.logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    });
    const endTime = new Date().getTime();
    logger_1.logger.info(loggerOptions, `Processed ${accountIds.length} active accounts in ${((endTime - startTime) /
        1000).toFixed(0)}s`);
    logger_1.logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
    setTimeout(() => crawler(false), config.pollingTime);
};
crawler(true).catch((error) => {
    logger_1.logger.error(loggerOptions, `Crawler error: ${error}`);
    Sentry.captureException(error);
    process.exit(-1);
});

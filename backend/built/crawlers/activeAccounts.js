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
const Sentry = __importStar(require("@sentry/node"));
const utils_1 = require("../lib/utils");
const pino_1 = __importDefault(require("pino"));
const backend_config_1 = require("../backend.config");
const crawlerName = 'activeAccounts';
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const logger = (0, pino_1.default)({
    level: backend_config_1.backendConfig.logLevel,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
const { chunkSize } = config;
const crawler = (delayedStart) => __awaiter(void 0, void 0, void 0, function* () {
    if (delayedStart && config.startDelay) {
        logger.debug(loggerOptions, `Delaying active accounts crawler start for ${config.startDelay / 1000}s`);
        yield (0, utils_1.wait)(config.startDelay);
    }
    logger.debug(loggerOptions, 'Running active accounts crawler...');
    const client = yield (0, utils_1.getClient)(loggerOptions);
    const api = yield (0, utils_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = yield (0, utils_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        yield (0, utils_1.wait)(10000);
        synced = yield (0, utils_1.isNodeSynced)(api, loggerOptions);
    }
    const startTime = new Date().getTime();
    const accountIds = yield (0, utils_1.fetchAccountIds)(api);
    logger.info(loggerOptions, `Got ${accountIds.length} active accounts`);
    const chunks = (0, utils_1.chunker)(accountIds, chunkSize);
    logger.info(loggerOptions, `Processing chunks of ${chunkSize} accounts`);
    for (const chunk of chunks) {
        const chunkStartTime = Date.now();
        yield Promise.all(chunk.map((accountId) => (0, utils_1.processAccountsChunk)(api, client, accountId, loggerOptions)));
        const chunkEndTime = new Date().getTime();
        logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} in ${((chunkEndTime - chunkStartTime) / 1000).toFixed(3)}s`);
    }
    logger.debug(loggerOptions, 'Disconnecting from API');
    yield api.disconnect().catch((error) => {
        logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    });
    logger.debug(loggerOptions, 'Disconnecting from DB');
    yield client.end().catch((error) => {
        logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    });
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Processed ${accountIds.length} active accounts in ${((endTime - startTime) / 1000).toFixed(0)}s`);
    logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
    setTimeout(() => crawler(false), config.pollingTime);
});
crawler(true).catch((error) => {
    logger.error(loggerOptions, `Crawler error: ${error}`);
    Sentry.captureException(error);
    process.exit(-1);
});

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
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const pino_1 = __importDefault(require("pino"));
const child_process_1 = require("child_process");
const utils_1 = require("./lib/utils");
const backend_config_1 = require("./backend.config");
// import * as Tracing from '@sentry/tracing';
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const logger = (0, pino_1.default)({
    level: backend_config_1.backendConfig.logLevel,
});
const runCrawler = async (crawler) => {
    const child = (0, child_process_1.spawn)('node', [`${crawler}`]);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', () => {
        // attempt to restart crawler
        runCrawler(crawler);
    });
    child.on('exit', () => {
        // attempt to restart crawler
        runCrawler(crawler);
    });
};
const runCrawlers = async () => {
    logger.debug('Starting backend, waiting 10s...');
    await (0, utils_1.wait)(10000);
    logger.debug('Running crawlers');
    await Promise.all(backend_config_1.backendConfig.crawlers
        .filter(({ enabled }) => enabled)
        .map(({ crawler }) => runCrawler(crawler)));
};
runCrawlers().catch((error) => {
    logger.debug(`Error while trying to run crawlers: ${error}`);
    Sentry.captureException(error);
    process.exit(-1);
});

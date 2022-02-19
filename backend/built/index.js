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
const pino_1 = __importDefault(require("pino"));
const child_process_1 = require("child_process");
const utils_1 = require("./lib/utils");
const backend_config_1 = require("./backend.config");
// import * as Tracing from '@sentry/tracing';
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const logger = (0, pino_1.default)();
const runCrawler = (crawler) => __awaiter(void 0, void 0, void 0, function* () {
    const child = (0, child_process_1.spawn)('node', [`${crawler}`]);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', (exitCode) => {
        logger.debug(`Crawler ${crawler} exit with code: ${exitCode}`);
        return -1;
    });
});
const runCrawlers = () => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug('Starting backend, waiting 10s...');
    yield (0, utils_1.wait)(10000);
    logger.debug('Running crawlers');
    yield Promise.all(backend_config_1.backendConfig.crawlers
        .filter((crawler) => crawler.enabled)
        .map(({ crawler }) => runCrawler(crawler)));
});
runCrawlers().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    Sentry.captureException(error);
    process.exit(-1);
});

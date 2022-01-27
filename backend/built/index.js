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
const child_process_1 = require("child_process");
const utils_1 = require("./lib/utils");
const backend_config_1 = require("./backend.config");
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
    process.exit(-1);
});

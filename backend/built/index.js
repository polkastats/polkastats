var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-check
const pino = require('pino');
const { spawn } = require('child_process');
const { wait } = require('./lib/utils');
const config = require('./backend.config');
const logger = pino();
const runCrawler = (crawler) => __awaiter(this, void 0, void 0, function* () {
    const child = spawn('node', [`${crawler}`]);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', (exitCode) => {
        logger.debug(`Crawler ${crawler} exit with code: ${exitCode}`);
        return -1;
    });
});
const runCrawlers = () => __awaiter(this, void 0, void 0, function* () {
    logger.debug('Starting backend, waiting 10s...');
    yield wait(10000);
    logger.debug('Running crawlers');
    yield Promise.all(config.crawlers
        .filter((crawler) => crawler.enabled)
        .map(({ crawler }) => runCrawler(crawler)));
});
runCrawlers().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(-1);
});

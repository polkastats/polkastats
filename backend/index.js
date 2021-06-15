// @ts-check
const pino = require('pino');
const { spawn } = require('child_process');
const { wait } = require('./lib/utils');
const config = require('./backend.config');

const logger = pino();

const runCrawler = async (crawler) => {
  const child = spawn('node', [`${crawler}`]);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.on('close', (exitCode) => {
    logger.info(`Crawler ${crawler} exit with code: ${exitCode}`);
    return -1;
  });
};

const runCrawlers = async () => {
  logger.info('Starting backend, waiting 10s...');
  await wait(10000);

  logger.info('Running crawlers');
  await Promise.all(
    config.crawlers
      .filter((crawler) => crawler.enabled)
      .map(({ crawler }) => runCrawler(crawler)),
  );
};

runCrawlers().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});

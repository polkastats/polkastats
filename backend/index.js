// @ts-check
const pino = require('pino');
const { spawn } = require('child_process');
const { wait } = require('./lib/utils.js');
const config = require('./backend.config.js');

const logger = pino();

const runCrawlers = async () => {
  logger.info('Starting backend, waiting 15s...');
  await wait(15000);

  logger.info('Running crawlers');

  config.crawlers
    .filter((crawler) => crawler.enabled)
    .forEach(
      ({ crawler }) => spawn('node', [`${crawler}`]),
    );
};

runCrawlers().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});

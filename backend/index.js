// @ts-check
const DBMigrate = require('db-migrate');
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
    logger.warn(`Crawler ${crawler} exit with code: ${exitCode}`);
    return -1;
  });
  child.on('exit', (exitCode, signal) => {
    logger.warn(`Crawler ${crawler} exit with code: ${exitCode} and signal: ${signal}`);
  });
  child.on('uncaughtException', (error) => {
    logger.warn(`Crawler ${crawler} exit with uncaughtException: ${error}`);
  });
  child.on('SIGUSR1', () => {
    logger.warn(`Crawler ${crawler} exit SIGUSR1`);
  });
  child.on('SIGUSR2', () => {
    logger.warn(`Crawler ${crawler} exit SIGUSR2`);
  });
};

const runCrawlers = async () => {
  logger.info('Running migrations');
  await DBMigrate.getInstance(true, {
    env: process.env.NODE_ENV || 'local',
    config: '../db/database.json',
    cmdOptions: {
      'migrations-dir': '../db/migrations',
    },
  }).up();
  logger.info('Migrations completed');

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

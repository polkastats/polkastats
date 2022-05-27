// @ts-check
const express = require('express');
const DBMigrate = require('db-migrate');
const pino = require('pino');
const { spawn } = require('child_process');
const { wait } = require('./lib/utils');
const config = require('./backend.config');
const Status = require('./services/status');

const app = express();
const logger = pino();
const status = new Status(config.crawlers.map((crawler) => crawler.name));

const runCrawler = async ({ crawler, name }) => {
  const child = spawn('node', [`${crawler}`]);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.on('close', (exitCode) => {
    logger.warn(`Crawler ${crawler} exit with code: ${exitCode}`);
    return -1;
  });
  child.on('exit', (exitCode, signal) => {
    logger.warn(`Crawler ${crawler} exit with code: ${exitCode} and signal: ${signal}`);
    status.set(name, `exit code ${exitCode}, signal ${signal}`);
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
      .map((crawler) => runCrawler(crawler)),
  );
};

runCrawlers().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(-1);
});

app.get('/health', (req, res) => {
  const statuses = status.getAll();
  const httpStatus = status.allIsHealthy() ? 200 : 503;
  res.status(httpStatus);
  res.json(statuses);
});

app.listen(config.port, async () => {
  logger.info(`App is listening on port ${config.port}`);
});

// @ts-check
import * as Sentry from '@sentry/node';
import pino from 'pino';
import { spawn } from 'child_process';
import { wait } from './lib/utils';
import { backendConfig } from './backend.config';
// import * as Tracing from '@sentry/tracing';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

const logger = pino({
  level: backendConfig.logLevel,
});

const runCrawler = async (crawler: string) => {
  const child = spawn('node', [`${crawler}`]);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  const loggerOptions = {
    crawler,
  };
  child.on('error', (error) => {
    logger.error(loggerOptions, `Crawler error: ${error}`);
  });
  child.on('close', (code) => {
    logger.error(loggerOptions, `Crawler closed with code ${code}`);
    // attempt to restart crawler
    runCrawler(crawler);
  });
  child.on('exit', (code) => {
    logger.error(loggerOptions, `Crawler exited with code ${code}`);
    // attempt to restart crawler
    runCrawler(crawler);
  });
};

const runCrawlers = async () => {
  logger.debug('Starting backend, waiting 10s...');
  await wait(10000);

  logger.debug('Running crawlers');
  await Promise.all(
    backendConfig.crawlers
      .filter(({ enabled }) => enabled)
      .map(({ crawler }) => runCrawler(crawler)),
  );
};

runCrawlers().catch((error) => {
  logger.debug(`Error while trying to run crawlers: ${error}`);
  Sentry.captureException(error);
  process.exit(-1);
});

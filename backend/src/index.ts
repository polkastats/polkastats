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

const logger = pino();

const runCrawler = async (crawler: string) => {
  const child = spawn('node', [`${crawler}`]);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.on('close', (exitCode) => {
    logger.debug(`Crawler ${crawler} exit with code: ${exitCode}`);
    return -1;
  });
};

const runCrawlers = async () => {
  logger.debug('Starting backend, waiting 10s...');
  await wait(10000);

  logger.debug('Running crawlers');
  await Promise.all(
    backendConfig.crawlers
      .filter((crawler) => crawler.enabled)
      .map(({ crawler }) => runCrawler(crawler)),
  );
};

runCrawlers().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  Sentry.captureException(error);
  process.exit(-1);
});

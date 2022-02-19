// @ts-check
import * as Sentry from '@sentry/node';
import pino from 'pino';
import { spawn } from 'child_process';
import { wait } from './lib/utils';
import { backendConfig } from './backend.config';
// import * as Tracing from '@sentry/tracing';

const logger = pino();

Sentry.init({
  dsn: backendConfig.sentryDSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

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
  process.exit(-1);
});

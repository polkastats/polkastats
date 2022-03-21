// @ts-check
import * as Sentry from '@sentry/node';
import { getClient } from '../lib/db';
import { getPolkadotAPI, isNodeSynced } from '../lib/chain';
import { fetchAccountIds, processAccountsChunk } from '../lib/account';
import { chunker, wait } from '../lib/utils';
import { backendConfig } from '../backend.config';
import { CrawlerConfig } from '../lib/types';
import { logger } from '../lib/logger';

const crawlerName = 'activeAccounts';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

const loggerOptions = {
  crawler: crawlerName,
};

const config: CrawlerConfig = backendConfig.crawlers.find(
  ({ name }) => name === crawlerName,
);

const { chunkSize } = config;

const crawler = async (delayedStart: boolean) => {
  if (delayedStart && config.startDelay) {
    logger.debug(
      loggerOptions,
      `Delaying active accounts crawler start for ${config.startDelay / 1000}s`,
    );
    await wait(config.startDelay);
  }

  logger.debug(loggerOptions, 'Running active accounts crawler...');

  const client = await getClient(loggerOptions);
  const api = await getPolkadotAPI(loggerOptions, config.apiCustomTypes);

  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    await wait(10000);
    synced = await isNodeSynced(api, loggerOptions);
  }

  const startTime = new Date().getTime();
  const accountIds = await fetchAccountIds(api);
  logger.info(loggerOptions, `Got ${accountIds.length} active accounts`);
  const chunks = chunker(accountIds, chunkSize);
  logger.info(loggerOptions, `Processing chunks of ${chunkSize} accounts`);

  for (const chunk of chunks) {
    const chunkStartTime = Date.now();
    await Promise.all(
      chunk.map((accountId: any) =>
        processAccountsChunk(api, client, accountId, loggerOptions),
      ),
    );
    const chunkEndTime = new Date().getTime();
    logger.info(
      loggerOptions,
      `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} in ${(
        (chunkEndTime - chunkStartTime) /
        1000
      ).toFixed(3)}s`,
    );
  }

  logger.debug(loggerOptions, 'Disconnecting from API');
  await api.disconnect().catch((error) => {
    logger.error(
      loggerOptions,
      `API disconnect error: ${JSON.stringify(error)}`,
    );
    Sentry.captureException(error);
  });

  logger.debug(loggerOptions, 'Disconnecting from DB');
  await client.end().catch((error) => {
    logger.error(
      loggerOptions,
      `DB disconnect error: ${JSON.stringify(error)}`,
    );
    Sentry.captureException(error);
  });

  const endTime = new Date().getTime();
  logger.info(
    loggerOptions,
    `Processed ${accountIds.length} active accounts in ${(
      (endTime - startTime) /
      1000
    ).toFixed(0)}s`,
  );

  logger.info(
    loggerOptions,
    `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`,
  );
  setTimeout(() => crawler(false), config.pollingTime);
};

crawler(true).catch((error) => {
  logger.error(loggerOptions, `Crawler error: ${error}`);
  Sentry.captureException(error);
  process.exit(-1);
});

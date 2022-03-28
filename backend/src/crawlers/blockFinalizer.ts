// @ts-check
import * as Sentry from '@sentry/node';
import { getClient } from '../lib/db';
import { getPolkadotAPI, isNodeSynced } from '../lib/chain';
import { updateFinalizedBlock } from '../lib/block';
import { wait } from '../lib/utils';
import { backendConfig } from '../backend.config';
import { CrawlerConfig } from '../lib/types';
import { logger } from '../lib/logger';

const crawlerName = 'blockFinalizer';

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

const crawler = async () => {
  logger.info(
    loggerOptions,
    `Delaying block finalizer start for ${config.startDelay / 1000}s`,
  );
  await wait(config.startDelay);

  logger.info(loggerOptions, 'Starting block finalizer...');

  const client = await getClient(loggerOptions);
  const api = await getPolkadotAPI(loggerOptions, config.apiCustomTypes);

  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    await wait(10000);
    synced = await isNodeSynced(api, loggerOptions);
  }

  // Subscribe to finalized blocks
  let trackedBlock = 0;
  let initTracking = true;
  await api.rpc.chain.subscribeFinalizedHeads(async (blockHeader) => {
    const blockNumber = blockHeader.number.toNumber();
    if (initTracking) {
      trackedBlock = blockNumber;
      initTracking = false;
    }
    // Handle missing blocks from subscription
    for (
      let blockToUpdate = trackedBlock + 1;
      blockToUpdate <= blockNumber;
      blockToUpdate++
    ) {
      await updateFinalizedBlock(
        config,
        api,
        client,
        blockToUpdate,
        loggerOptions,
      );
    }
    trackedBlock = blockNumber;
  });
};

crawler().catch((error) => {
  logger.error(loggerOptions, `Crawler error: ${error}`);
  Sentry.captureException(error);
  process.exit(-1);
});

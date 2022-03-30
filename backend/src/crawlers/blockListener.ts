// @ts-check
import * as Sentry from '@sentry/node';
import { getClient } from '../lib/db';
import { getPolkadotAPI, isNodeSynced } from '../lib/chain';
import { harvestBlock, updateFinalizedBlock, storeMetadata } from '../lib/block';
import { wait } from '../lib/utils';
import { backendConfig } from '../backend.config';
import { CrawlerConfig } from '../lib/types';
import { logger } from '../lib/logger';

const crawlerName = 'blockListener';

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
  logger.info(loggerOptions, 'Starting block listener...');

  const client = await getClient(loggerOptions);
  const api = await getPolkadotAPI(loggerOptions, config.apiCustomTypes);

  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    await wait(10000);
    synced = await isNodeSynced(api, loggerOptions);
  }

  // update accounts info for addresses found on block events data
  const doUpdateAccountsInfo = true;

  // Subscribe to new blocks
  let iteration = 0;
  let trackedFinalizedBlock = 0;
  let initTracking = true;
  await api.rpc.chain.subscribeNewHeads(async (blockHeader) => {
    iteration++;
    const blockNumber = blockHeader.number.toNumber();
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    
    // track block finalization
    const finalizedBlockHash = await api.rpc.chain.getFinalizedHead();
    const { block: finalizedBlock } = await api.rpc.chain.getBlock(finalizedBlockHash);
    const finalizedBlockNumber = finalizedBlock.header.number.toNumber();
    if (initTracking) {
      trackedFinalizedBlock = finalizedBlockNumber;
      initTracking = false;
    }
    // handle missing finalized blocks from subscription
    if (finalizedBlockNumber > trackedFinalizedBlock) {
      for (
        let blockToUpdate = trackedFinalizedBlock;
        blockToUpdate <= finalizedBlockNumber;
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
    }
    trackedFinalizedBlock = finalizedBlockNumber;
    // end track block finalization

    try {
      await harvestBlock(config, api, client, blockNumber, doUpdateAccountsInfo, loggerOptions);

      // store current runtime metadata in first iteration
      if (iteration === 1) {
        const runtimeVersion = await api.rpc.state.getRuntimeVersion(blockHash);
        const apiAt = await api.at(blockHash);
        const timestamp = await apiAt.query.timestamp.now();
        const specName = runtimeVersion.toJSON().specName;
        const specVersion = runtimeVersion.specVersion;
        await storeMetadata(
          client,
          blockNumber,
          blockHash.toString(),
          specName.toString(),
          specVersion.toNumber(),
          timestamp.toNumber(),
          loggerOptions,
        );
      }
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding block #${blockNumber}: ${error}`,
      );
      Sentry.captureException(error);
    }

    
  });
};

crawler().catch((error) => {
  logger.error(loggerOptions, `Crawler error: ${error}`);
  Sentry.captureException(error);
  process.exit(-1);
});

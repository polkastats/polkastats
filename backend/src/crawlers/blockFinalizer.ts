// @ts-check
import * as Sentry from '@sentry/node';
import { dbParamQuery, getClient } from '../lib/db';
import { getPolkadotAPI, isNodeSynced } from '../lib/chain';
import { getDisplayName, updateFinalized } from '../lib/block';
import { wait, shortHash } from '../lib/utils';
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
  await api.rpc.chain.subscribeFinalizedHeads(async (blockHeader) => {
    const startTime = new Date().getTime();
    const blockNumber = blockHeader.number.toNumber();
    try {
      const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
      const extendedHeader = await api.derive.chain.getHeader(blockHash);
      const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;
      const blockAuthorIdentity = await api.derive.accounts.info(
        extendedHeader.author,
      );
      const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
      const data = [
        extendedHeader.author,
        blockAuthorName,
        blockHash,
        parentHash,
        extrinsicsRoot,
        stateRoot,
        blockNumber,
      ];
      const sql = `UPDATE
          block SET block_author = $1,
          block_author_name = $2,
          block_hash = $3,
          parent_hash = $4,
          extrinsics_root = $5,
          state_root = $6
        WHERE block_number = $7`;
      await dbParamQuery(client, sql, data, loggerOptions);

      // Update finalized blocks
      await updateFinalized(client, blockNumber, loggerOptions);

      const endTime = new Date().getTime();
      logger.info(
        loggerOptions,
        `Updated finalized block #${blockNumber} (${shortHash(
          blockHash.toString(),
        )}) in ${((endTime - startTime) / 1000).toFixed(3)}s`,
      );
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error updating finalized block #${blockNumber}: ${error}`,
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

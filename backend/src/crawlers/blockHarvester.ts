// @ts-check
import * as Sentry from '@sentry/node';
import {
  getClient,
  dbQuery,
  getPolkadotAPI,
  isNodeSynced,
  healthCheck,
  harvestBlocks,
  harvestBlocksSeq,
} from '../lib/chain';
import { wait } from '../lib/utils';
import pino from 'pino';
import { backendConfig } from '../backend.config';
import { CrawlerConfig } from '../lib/types';

const crawlerName = 'blockHarvester';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

const logger = pino({
  level: backendConfig.logLevel,
});
const loggerOptions = {
  crawler: crawlerName,
};
const config: CrawlerConfig = backendConfig.crawlers.find(
  ({ name }) => name === crawlerName,
);

const crawler = async (delayedStart: boolean) => {
  if (delayedStart) {
    logger.info(loggerOptions, `Delaying block harvester crawler start for ${config.startDelay / 1000}s`);
    await wait(config.startDelay);
  }

  logger.info(loggerOptions, 'Starting block harvester...');
  const startTime = new Date().getTime();
  const client = await getClient(loggerOptions);

  // Delete blocks that don't have all its events or extrinsics in db
  await healthCheck(config, client, loggerOptions);

  const api = await getPolkadotAPI(loggerOptions, config.apiCustomTypes);
  let synced = await isNodeSynced(api, loggerOptions);
  while (!synced) {
    await wait(10000);
    synced = await isNodeSynced(api, loggerOptions);
  }
  // Get gaps from block table
  // Thanks to @miguelmota: https://gist.github.com/miguelmota/6d40be2ecb083507de1d073443154610
  const sqlSelect = `
  SELECT
    gap_start, gap_end FROM (
      SELECT
        block_number + 1 AS gap_start,
        next_nr - 1 AS gap_end
      FROM (
        SELECT block_number, lead(block_number) OVER (ORDER BY block_number) AS next_nr
        FROM block
      ) nr
      WHERE nr.block_number + 1 <> nr.next_nr
  ) AS g UNION ALL (
    SELECT
      0 AS gap_start,
      block_number AS gap_end
    FROM
      block
    ORDER BY
      block_number ASC
    LIMIT 1
  )
  ORDER BY gap_start DESC
  `;
  const res = await dbQuery(client, sqlSelect, loggerOptions);
  for (const row of res.rows) {
    if (!(row.gap_start === 0 && row.gap_end === 0)) {
      logger.info(loggerOptions, `Detected gap! Harvesting blocks from #${row.gap_end} to #${row.gap_start}`);
      if (config.mode === 'chunks') {
        await harvestBlocks(
          config,
          api,
          client,
          parseInt(row.gap_start, 10),
          parseInt(row.gap_end, 10),
          loggerOptions,
        );
      } else {
        await harvestBlocksSeq(
          config,
          api,
          client,
          parseInt(row.gap_start, 10),
          parseInt(row.gap_end, 10),
          loggerOptions,
        );
      }
    }
  }
  logger.debug(loggerOptions, 'Disconnecting from API');
  await api.disconnect().catch((error) => {
    logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`);
    Sentry.captureException(error);
  });
  logger.debug(loggerOptions, 'Disconnecting from DB');
  await client.end().catch((error) => {
    logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`);
    Sentry.captureException(error);
  });

  // Log execution time
  const endTime = new Date().getTime();
  logger.info(loggerOptions, `Executed in ${((endTime - startTime) / 1000).toFixed(0)}s`);
  logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
  setTimeout(
    () => crawler(false),
    config.pollingTime,
  );
};

crawler(true).catch((error) => {
  logger.error(loggerOptions, `Crawler error: ${error}`);
  Sentry.captureException(error);
  process.exit(-1);
});

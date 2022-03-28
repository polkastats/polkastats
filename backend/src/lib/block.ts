// @ts-check
import * as Sentry from '@sentry/node';
import { ApiPromise } from '@polkadot/api';
import { DeriveAccountRegistration } from '@polkadot/api-derive/types';
import { Client } from 'pg';
import axios from 'axios';
import { chunker, range, reverseRange, shortHash } from './utils';
import { CrawlerConfig, LoggerOptions } from './types';
import { dbParamQuery, dbQuery } from './db';
import { backendConfig } from '../backend.config';
import { logger } from './logger';
import { processLogs } from './log';
import { processEvents } from './event';
import { processExtrinsics } from './extrinsic';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

export const getDisplayName = (identity: DeriveAccountRegistration): string => {
  if (
    identity.displayParent &&
    identity.displayParent !== '' &&
    identity.display &&
    identity.display !== ''
  ) {
    return `${identity.displayParent} / ${identity.display}`;
  }
  return identity.display || '';
};

export const updateFinalized = async (
  client: Client,
  finalizedBlock: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const sql = `
    UPDATE block SET finalized = true WHERE finalized = false AND block_number <= $1;
  `;
  try {
    await client.query(sql, [finalizedBlock]);
  } catch (error) {
    logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
    Sentry.captureException(error);
  }
};

export const logHarvestError = async (
  client: Client,
  blockNumber: number,
  error: any,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const timestamp = new Date().getTime();
  const errorString = error.toString().replace(/'/g, "''");
  const data = [blockNumber, errorString, timestamp];
  const query = `
    INSERT INTO
      harvest_error (block_number, error, timestamp)
    VALUES
      ($1, $2, $3)
    ON CONFLICT ON CONSTRAINT
      harvest_error_pkey 
      DO NOTHING
    ;`;
  await dbParamQuery(client, query, data, loggerOptions);
};

export const healthCheck = async (
  config: CrawlerConfig,
  client: Client,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const startTime = new Date().getTime();
  logger.info(loggerOptions, 'Starting health check');
  const query = `
    SELECT
      b.block_number,
      b.total_events,
      (SELECT COUNT(*) FROM event AS ev WHERE ev.block_number = b.block_number) AS table_total_events,
      b.total_extrinsics,
      (SELECT COUNT(*) FROM extrinsic AS ex WHERE ex.block_number = b.block_number) table_total_extrinsics
    FROM
      block AS b
    WHERE
      b.total_events > (SELECT COUNT(*) FROM event AS ev WHERE ev.block_number = b.block_number)
    OR
      b.total_extrinsics > (SELECT COUNT(*) FROM extrinsic AS ex WHERE ex.block_number = b.block_number) 
    ;`;
  const res = await dbQuery(client, query, loggerOptions);
  for (const row of res.rows) {
    logger.info(
      loggerOptions,
      `Health check failed for block #${row.block_number}, deleting block from block table!`,
    );
    await dbQuery(
      client,
      `DELETE FROM block WHERE block_number = '${row.block_number}';`,
      loggerOptions,
    );
  }
  const endTime = new Date().getTime();
  logger.debug(
    loggerOptions,
    `Health check finished in ${((endTime - startTime) / 1000).toFixed(
      config.statsPrecision,
    )}s`,
  );
};

export const storeMetadata = async (
  client: Client,
  blockNumber: number,
  blockHash: string,
  specName: string,
  specVersion: number,
  timestamp: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  let metadata;
  try {
    const response = await axios.get(
      `${backendConfig.substrateApiSidecar}/runtime/metadata?at=${blockHash}`,
    );
    metadata = response.data;
    logger.debug(loggerOptions, `Got runtime metadata at ${blockHash}!`);
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error fetching runtime metadata at ${blockHash}: ${JSON.stringify(
        error,
      )}`,
    );
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }
  const data = [
    blockNumber,
    specName,
    specVersion,
    Object.keys(metadata.metadata)[0],
    metadata.magicNumber,
    metadata.metadata,
    timestamp,
  ];
  const query = `
    INSERT INTO runtime (
      block_number,
      spec_name,
      spec_version,
      metadata_version,
      metadata_magic_number,
      metadata,
      timestamp
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7
    )
    ON CONFLICT (spec_version)
    DO UPDATE SET
      block_number = EXCLUDED.block_number
    WHERE EXCLUDED.block_number < runtime.block_number;`;
  await dbParamQuery(client, query, data, loggerOptions);
};

export const harvestBlock = async (
  config: CrawlerConfig,
  api: ApiPromise,
  client: Client,
  blockNumber: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const startTime = new Date().getTime();
  try {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const apiAt = await api.at(blockHash);
    const [
      derivedBlock,
      totalIssuance,
      runtimeVersion,
      activeEra,
      currentIndex,
    ] = await Promise.all([
      api.derive.chain.getBlock(blockHash),
      apiAt.query.balances.totalIssuance(),
      api.rpc.state.getRuntimeVersion(blockHash),
      apiAt.query?.staking.activeEra
        ? apiAt.query.staking.activeEra().then((res) => res.unwrap().index)
        : 0,
      apiAt.query.session.currentIndex(),
    ]);
    const { block, author, events: blockEvents } = derivedBlock;
    // genesis block doesn't have author
    const blockAuthor = author ? author.toString() : '';
    const { parentHash, extrinsicsRoot, stateRoot } = block.header;
    const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
    const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
    // genesis block doesn't expose timestamp or any other extrinsic
    const timestamp =
      blockNumber !== 0
        ? parseInt(
            block.extrinsics
              .find(
                ({ method: { section, method } }) =>
                  section === 'timestamp' && method === 'set',
              )
              .args[0].toString(),
            10,
          )
        : 0;

    // Totals
    const totalEvents = blockEvents.length;
    const totalExtrinsics = block.extrinsics.length;

    const data = [
      blockNumber,
      false,
      blockAuthor?.toString() ? blockAuthor.toString() : '',
      blockAuthorName,
      blockHash.toString(),
      parentHash.toString(),
      extrinsicsRoot.toString(),
      stateRoot.toString(),
      activeEra,
      currentIndex,
      runtimeVersion.specVersion,
      totalEvents,
      totalExtrinsics,
      totalIssuance.toString(),
      timestamp,
    ];
    const sql = `INSERT INTO block (
        block_number,
        finalized,
        block_author,
        block_author_name,
        block_hash,
        parent_hash,
        extrinsics_root,
        state_root,
        active_era,
        current_index,
        spec_version,
        total_events,
        total_extrinsics,
        total_issuance,
        timestamp
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15
      )
      ON CONFLICT (block_number)
      DO UPDATE SET
        block_author = EXCLUDED.block_author,
        block_author_name = EXCLUDED.block_author_name,
        block_hash = EXCLUDED.block_hash,
        parent_hash = EXCLUDED.parent_hash,
        extrinsics_root = EXCLUDED.extrinsics_root,
        state_root = EXCLUDED.state_root
      WHERE EXCLUDED.block_number = block.block_number
      ;`;
    try {
      await dbParamQuery(client, sql, data, loggerOptions);
      const endTime = new Date().getTime();
      logger.info(
        loggerOptions,
        `Added block #${blockNumber} (${shortHash(blockHash.toString())}) in ${(
          (endTime - startTime) /
          1000
        ).toFixed(config.statsPrecision)}s`,
      );
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding block #${blockNumber}: ${error}`,
      );
      const scope = new Sentry.Scope();
      scope.setTag('blockNumber', blockNumber);
      Sentry.captureException(error, scope);
    }

    // Runtime upgrade
    const runtimeUpgrade = blockEvents.find(
      ({ event: { section, method } }) =>
        section === 'system' && method === 'CodeUpdated',
    );

    if (runtimeUpgrade) {
      const specName = runtimeVersion.toJSON().specName;
      const specVersion = runtimeVersion.specVersion;

      // TODO: enable again
      // see: https://github.com/polkadot-js/api/issues/4596
      // const metadata = await api.rpc.state.getMetadata(blockHash);

      await storeMetadata(
        client,
        blockNumber,
        blockHash.toString(),
        specName.toString(),
        specVersion.toNumber(),
        timestamp,
        loggerOptions,
      );
    }

    await Promise.all([
      // Store block extrinsics
      processExtrinsics(
        api,
        apiAt,
        client,
        blockNumber,
        blockHash,
        block.extrinsics,
        blockEvents,
        timestamp,
        loggerOptions,
      ),
      // Store module events
      processEvents(
        client,
        blockNumber,
        parseInt(activeEra.toString()),
        blockEvents,
        block.extrinsics,
        timestamp,
        loggerOptions,
      ),
      // Store block logs
      processLogs(
        client,
        blockNumber,
        block.header.digest.logs,
        timestamp,
        loggerOptions,
      ),
    ]);
  } catch (error) {
    logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
    await logHarvestError(client, blockNumber, error, loggerOptions);
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }
};

// eslint-disable-next-line no-unused-vars
export const harvestBlocksSeq = async (
  config: CrawlerConfig,
  api: ApiPromise,
  client: Client,
  startBlock: number,
  endBlock: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const reverseOrder = true;
  const blocks = reverseOrder
    ? reverseRange(startBlock, endBlock, 1)
    : range(startBlock, endBlock, 1);
  const blockProcessingTimes = [];
  let maxTimeMs = 0;
  let minTimeMs = 1000000;
  let avgTimeMs = 0;

  for (const blockNumber of blocks) {
    const blockStartTime = Date.now();
    await harvestBlock(config, api, client, blockNumber, loggerOptions);
    const blockEndTime = new Date().getTime();

    // Cook some stats
    const blockProcessingTimeMs = blockEndTime - blockStartTime;
    if (blockProcessingTimeMs < minTimeMs) {
      minTimeMs = blockProcessingTimeMs;
    }
    if (blockProcessingTimeMs > maxTimeMs) {
      maxTimeMs = blockProcessingTimeMs;
    }
    blockProcessingTimes.push(blockProcessingTimeMs);
    avgTimeMs =
      blockProcessingTimes.reduce(
        (sum, blockProcessingTime) => sum + blockProcessingTime,
        0,
      ) / blockProcessingTimes.length;
    const completed = ((blocks.indexOf(blockNumber) + 1) * 100) / blocks.length;

    logger.info(
      loggerOptions,
      `Processed block #${blockNumber} ${blocks.indexOf(blockNumber) + 1}/${
        blocks.length
      } [${completed.toFixed(config.statsPrecision)}%] in ${(
        blockProcessingTimeMs / 1000
      ).toFixed(config.statsPrecision)}s min/max/avg: ${(
        minTimeMs / 1000
      ).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(
        config.statsPrecision,
      )}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)}`,
    );
  }
};

export const harvestBlocks = async (
  config: CrawlerConfig,
  api: ApiPromise,
  client: Client,
  startBlock: number,
  endBlock: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const reverseOrder = true;
  const blocks = reverseOrder
    ? reverseRange(startBlock, endBlock, 1)
    : range(startBlock, endBlock, 1);

  const chunks = chunker(blocks, config.chunkSize);
  logger.info(loggerOptions, `Processing chunks of ${config.chunkSize} blocks`);

  const chunkProcessingTimes = [];
  let maxTimeMs = 0;
  let minTimeMs = 1000000;
  let avgTimeMs = 0;
  let avgBlocksPerSecond = 0;

  for (const chunk of chunks) {
    const chunkStartTime = Date.now();
    await Promise.all(
      chunk.map((blockNumber: number) =>
        harvestBlock(config, api, client, blockNumber, loggerOptions),
      ),
    );
    const chunkEndTime = new Date().getTime();

    // Cook some stats
    const chunkProcessingTimeMs = chunkEndTime - chunkStartTime;
    if (chunkProcessingTimeMs < minTimeMs) {
      minTimeMs = chunkProcessingTimeMs;
    }
    if (chunkProcessingTimeMs > maxTimeMs) {
      maxTimeMs = chunkProcessingTimeMs;
    }
    chunkProcessingTimes.push(chunkProcessingTimeMs);
    avgTimeMs =
      chunkProcessingTimes.reduce(
        (sum, chunkProcessingTime) => sum + chunkProcessingTime,
        0,
      ) / chunkProcessingTimes.length;
    avgBlocksPerSecond = 1 / (avgTimeMs / 1000 / config.chunkSize);
    const currentBlocksPerSecond =
      1 / (chunkProcessingTimeMs / 1000 / config.chunkSize);
    const completed = ((chunks.indexOf(chunk) + 1) * 100) / chunks.length;

    logger.info(
      loggerOptions,
      `Processed chunk ${chunks.indexOf(chunk) + 1}/${
        chunks.length
      } [${completed.toFixed(config.statsPrecision)}%] ` +
        `in ${(chunkProcessingTimeMs / 1000).toFixed(
          config.statsPrecision,
        )}s ` +
        `min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(
          maxTimeMs / 1000
        ).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(
          config.statsPrecision,
        )} ` +
        `cur/avg bps: ${currentBlocksPerSecond.toFixed(
          config.statsPrecision,
        )}/${avgBlocksPerSecond.toFixed(config.statsPrecision)}`,
    );
  }
};

export const updateFinalizedBlock = async (
  config: CrawlerConfig,
  api: ApiPromise,
  client: Client,
  blockNumber: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const startTime = new Date().getTime();
  try {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const extendedHeader = await api.derive.chain.getHeader(blockHash);
    const { parentHash, extrinsicsRoot, stateRoot } = extendedHeader;
    const blockAuthorIdentity = await api.derive.accounts.info(
      extendedHeader.author,
    );
    const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
    const data = [
      extendedHeader.author.toString(),
      blockAuthorName,
      blockHash.toString(),
      parentHash.toString(),
      extrinsicsRoot.toString(),
      stateRoot.toString(),
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
      )}) in ${((endTime - startTime) / 1000).toFixed(config.statsPrecision)}s`,
    );
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error updating finalized block #${blockNumber}: ${error}`,
    );
    Sentry.captureException(error);
  }
};

// @ts-check
import * as Sentry from '@sentry/node';
import { Client } from 'pg';
import { LoggerOptions } from './types';
import { backendConfig } from '../backend.config';
import { logger } from './logger';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

export const processLog = async (
  client: Client,
  blockNumber: number,
  log: any,
  index: number,
  timestamp: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const { type } = log;
  // this can change in the future...
  const [[engine, logData]] =
    type === 'RuntimeEnvironmentUpdated'
      ? [[null, null]]
      : Object.values(log.toHuman());
  const data = [blockNumber, index, type, engine, logData, timestamp];
  const sql = `INSERT INTO log (
      block_number,
      log_index,
      type,
      engine,
      data,
      timestamp
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6
    )
    ON CONFLICT ON CONSTRAINT log_pkey 
    DO NOTHING;
    ;`;
  try {
    await client.query(sql, data);
    logger.debug(loggerOptions, `Added log ${blockNumber}-${index}`);
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`,
    );
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }
};

export const processLogs = async (
  client: Client,
  blockNumber: number,
  logs: any[],
  timestamp: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const startTime = new Date().getTime();
  await Promise.all(
    logs.map((log, index) =>
      processLog(client, blockNumber, log, index, timestamp, loggerOptions),
    ),
  );
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(
    loggerOptions,
    `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(
      3,
    )}s`,
  );
};

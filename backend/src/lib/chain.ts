// @ts-check
import * as Sentry from '@sentry/node';
import '@polkadot/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';
import fs from 'fs';
import { backendConfig } from '../backend.config';
import { LoggerOptions } from './types';
import { logger } from './logger';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

export const getPolkadotAPI = async (
  loggerOptions: LoggerOptions,
  apiCustomTypes: string | undefined,
): Promise<ApiPromise> => {
  let api;
  logger.debug(loggerOptions, `Connecting to ${backendConfig.wsProviderUrl}`);
  const provider = new WsProvider(backendConfig.wsProviderUrl);
  
  provider.on('disconnected', () => logger.error(loggerOptions, `Got disconnected from provider ${backendConfig.wsProviderUrl}!`));

  if (apiCustomTypes && apiCustomTypes !== '') {
    const types = JSON.parse(
      fs.readFileSync(`./src/types/${apiCustomTypes}`, 'utf8'),
    );
    api = await ApiPromise.create({ provider, types });
  } else {
    api = await ApiPromise.create({ provider });
  }

  api.on('disconnected', () => logger.error(loggerOptions, 'Got disconnected from API!'));

  await api.isReady;
  return api;
};

export const isNodeSynced = async (
  api: ApiPromise,
  loggerOptions: LoggerOptions,
): Promise<boolean> => {
  let node;
  try {
    node = await api.rpc.system.health();
  } catch (error) {
    logger.error(loggerOptions, "Can't query node status");
    Sentry.captureException(error);
  }
  if (node && node.isSyncing.eq(false)) {
    logger.debug(loggerOptions, 'Node is synced!');
    return true;
  }
  logger.debug(loggerOptions, 'Node is NOT synced!');
  return false;
};

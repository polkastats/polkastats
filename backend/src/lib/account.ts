// @ts-check
import * as Sentry from '@sentry/node';
import { ApiPromise } from '@polkadot/api';
import { EventRecord } from '@polkadot/types/interfaces';
import { Vec } from '@polkadot/types';
import { Client } from 'pg';
import _ from 'lodash';
import { LoggerOptions } from './types';
import { dbParamQuery } from './db';
import { logger } from './logger';
import { backendConfig } from '../backend.config';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

export const getAccountIdFromArgs = (account: any[]): string[] =>
  account.map(({ args }) => args).map(([e]) => e.toHuman());

export const fetchAccountIds = async (api: ApiPromise): Promise<any[]> =>
  getAccountIdFromArgs(await api.query.system.account.keys());

export const processAccountsChunk = async (
  api: ApiPromise,
  client: Client,
  accountId: any,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const timestamp = Math.floor(parseInt(Date.now().toString(), 10) / 1000);
  const [block, identity, balances] = await Promise.all([
    api.rpc.chain
      .getBlock()
      .then((result) => result.block.header.number.toNumber()),
    api.derive.accounts.identity(accountId),
    api.derive.balances.all(accountId),
  ]);
  const availableBalance = balances.availableBalance.toString();
  const freeBalance = balances.freeBalance.toString();
  const lockedBalance = balances.lockedBalance.toString();
  const reservedBalance = balances.reservedBalance.toString();
  const totalBalance = balances.freeBalance
    .add(balances.reservedBalance)
    .toString();
  const identityDisplay = identity.display ? identity.display.toString() : '';
  const identityDisplayParent = identity.displayParent
    ? identity.displayParent.toString()
    : '';
  const JSONIdentity = identity.display ? JSON.stringify(identity) : '';
  const JSONbalances = JSON.stringify(balances);
  const nonce = balances.accountNonce.toString();
  const data = [
    accountId,
    JSONIdentity,
    identityDisplay,
    identityDisplayParent,
    JSONbalances,
    availableBalance,
    freeBalance,
    lockedBalance,
    reservedBalance,
    totalBalance,
    nonce,
    timestamp,
    block,
  ];
  const query = `
    INSERT INTO account (
      account_id,
      identity,
      identity_display,
      identity_display_parent,
      balances,
      available_balance,
      free_balance,
      locked_balance,
      reserved_balance,
      total_balance,
      nonce,
      timestamp,
      block_height
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
      $13
    )
    ON CONFLICT (account_id)
    DO UPDATE SET
      identity = EXCLUDED.identity,
      identity_display = EXCLUDED.identity_display,
      identity_display_parent = EXCLUDED.identity_display_parent,
      balances = EXCLUDED.balances,
      available_balance = EXCLUDED.available_balance,
      free_balance = EXCLUDED.free_balance,
      locked_balance = EXCLUDED.locked_balance,
      reserved_balance = EXCLUDED.reserved_balance,
      total_balance = EXCLUDED.total_balance,
      nonce = EXCLUDED.nonce,
      timestamp = EXCLUDED.timestamp,
      block_height = EXCLUDED.block_height
    WHERE EXCLUDED.block_height > account.block_height
  ;`;
  await dbParamQuery(client, query, data, loggerOptions);
};

export const updateAccountInfo = async (
  api: ApiPromise,
  client: Client,
  blockNumber: number,
  timestamp: number,
  address: string,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const [balances, { identity }] = await Promise.all([
    api.derive.balances.all(address),
    api.derive.accounts.info(address),
  ]);
  const accountId = balances.accountId.toHuman(); // ImOnline.HeartbeatReceived events return public key addresses but we want SS58 encoded address
  const availableBalance = balances.availableBalance.toString();
  const freeBalance = balances.freeBalance.toString();
  const lockedBalance = balances.lockedBalance.toString();
  const reservedBalance = balances.reservedBalance.toString();
  const totalBalance = balances.freeBalance
    .add(balances.reservedBalance)
    .toString();
  const identityDisplay = identity.display ? identity.display.toString() : '';
  const identityDisplayParent = identity.displayParent
    ? identity.displayParent.toString()
    : '';
  const JSONIdentity = identity.display ? JSON.stringify(identity) : '';
  const JSONbalances = JSON.stringify(balances);
  const nonce = balances.accountNonce.toString();
  const data = [
    accountId,
    JSONIdentity,
    identityDisplay,
    identityDisplayParent,
    JSONbalances,
    availableBalance,
    freeBalance,
    lockedBalance,
    reservedBalance,
    totalBalance,
    nonce,
    timestamp,
    blockNumber,
  ];
  const query = `
    INSERT INTO account (
      account_id,
      identity,
      identity_display,
      identity_display_parent,
      balances,
      available_balance,
      free_balance,
      locked_balance,
      reserved_balance,
      total_balance,
      nonce,
      timestamp,
      block_height
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
      $13
    )
    ON CONFLICT (account_id)
    DO UPDATE SET
      identity = EXCLUDED.identity,
      identity_display = EXCLUDED.identity_display,
      identity_display_parent = EXCLUDED.identity_display_parent,
      balances = EXCLUDED.balances,
      available_balance = EXCLUDED.available_balance,
      free_balance = EXCLUDED.free_balance,
      locked_balance = EXCLUDED.locked_balance,
      reserved_balance = EXCLUDED.reserved_balance,
      total_balance = EXCLUDED.total_balance,
      nonce = EXCLUDED.nonce,
      timestamp = EXCLUDED.timestamp,
      block_height = EXCLUDED.block_height
    WHERE EXCLUDED.block_height > account.block_height
  ;`;
  try {
    await client.query(query, data);
    logger.debug(
      loggerOptions,
      `Updated account info for event/s involved address ${address}`,
    );
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error updating account info for event/s involved address: ${JSON.stringify(
        error,
      )}`,
    );
    Sentry.captureException(error);
  }
};

export const deleteInactiveAccounts = async (
  client: Client,
  accountIds: any[],
  loggerOptions: LoggerOptions,
): Promise<void> => {

  logger.info(
    loggerOptions,
    'Deleting inactive accounts...',
  );

  const query = 'DELETE FROM account WHERE account_id != ALL($1::text[]);';
  await dbParamQuery(client, query, [accountIds], loggerOptions);

  logger.info(
    loggerOptions,
    'Deleting inactive accounts finished!',
  );

};

export const updateAccountsInfo = async (
  api: ApiPromise,
  client: Client,
  blockNumber: number,
  timestamp: number,
  loggerOptions: LoggerOptions,
  blockEvents: Vec<EventRecord>,
): Promise<void> => {
  const startTime = new Date().getTime();
  const involvedAddresses: string[] = [];
  blockEvents.forEach(({ event }: EventRecord) => {
    const types = event.typeDef;
    event.data.forEach((data, index) => {
      if (types[index].type === 'AccountId32') {
        involvedAddresses.push(data.toString());
      }
    });
  });
  const uniqueAddresses = _.uniq(involvedAddresses);
  await Promise.all(
    uniqueAddresses.map((address) =>
      updateAccountInfo(
        api,
        client,
        blockNumber,
        timestamp,
        address,
        loggerOptions,
      ),
    ),
  );
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(
    loggerOptions,
    `Updated ${uniqueAddresses.length} accounts in ${(
      (endTime - startTime) /
      1000
    ).toFixed(3)}s`,
  );
};

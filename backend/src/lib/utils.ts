// @ts-check
import '@polkadot/api-augment';
import pino from 'pino';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import { Client } from 'pg';
import _ from 'lodash';
import fs from 'fs';
import { backendConfig } from '../backend.config';
import type { Vec } from '@polkadot/types-codec';
import { Address, BlockHash, EventRecord } from '@polkadot/types/interfaces';
import { DeriveAccountRegistration } from '@polkadot/api-derive/types';
import { BigNumber } from 'bignumber.js';
import { AnyTuple } from '@polkadot/types/types';
import { GenericExtrinsic } from '@polkadot/types';

const logger = pino();

// Used for processing events and extrinsics
const chunkSize = 100;

export const getPolkadotAPI = async (loggerOptions: { crawler: string; }, apiCustomTypes: string | undefined) => {
  let api;
  logger.debug(loggerOptions, `Connecting to ${backendConfig.wsProviderUrl}`);
  const provider = new WsProvider(backendConfig.wsProviderUrl);
  if (apiCustomTypes && apiCustomTypes !== '') {
    const types = JSON.parse(fs.readFileSync(`./src/types/${apiCustomTypes}`, 'utf8'));
    api = await ApiPromise.create({ provider, types });
  } else {
    api = await ApiPromise.create({ provider });
  }
  await api.isReady;
  return api;
};

export const isNodeSynced = async (api: ApiPromise, loggerOptions: { crawler: string; }) => {
  let node;
  try {
    node = await api.rpc.system.health();
  } catch {
    logger.error(loggerOptions, "Can't query node status");
  }
  if (node && node.isSyncing.eq(false)) {
    logger.debug(loggerOptions, 'Node is synced!');
    return true;
  }
  logger.debug(loggerOptions, 'Node is NOT synced!');
  return false;
};

export const formatNumber = (number: number) => (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');

export const shortHash = (hash: string) => `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;

export const wait = async (ms: number ) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const getClient = async (loggerOptions: { crawler: string; }) => {
  logger.debug(loggerOptions, `Connecting to DB ${backendConfig.postgresConnParams.database} at ${backendConfig.postgresConnParams.host}:${backendConfig.postgresConnParams.port}`);
  const client = new Client(backendConfig.postgresConnParams);
  await client.connect();
  return client;
};

export const dbQuery = async (client: Client, sql: string, loggerOptions: { crawler: string; }) => {
  try {
    return await client.query(sql);
  } catch (error) {
    logger.error(loggerOptions, `SQL: ${sql} ERROR: ${JSON.stringify(error)}`);
  }
  return null;
};

export const dbParamQuery = async (client: Client, sql: string, data: any[], loggerOptions: { crawler: string; }) => {
  try {
    return await client.query(sql, data);
  } catch (error) {
    logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
  }
  return null;
};

export const isValidAddressPolkadotAddress = (address: string) => {
  try {
    encodeAddress(
      isHex(address)
        ? hexToU8a(address.toString())
        : decodeAddress(address),
    );
    return true;
  } catch (error) {
    return false;
  }
};

export const updateAccountsInfo = async (api: ApiPromise, client: Client, blockNumber: number, timestamp: number, loggerOptions: { crawler: string; }, blockEvents: Vec<EventRecord>) => {
  const startTime = new Date().getTime();
  const involvedAddresses: any = [];
  blockEvents
    .forEach(({ event }) => {
      event.data.forEach((arg: any) => {
        if (module.exports.isValidAddressPolkadotAddress(arg)) {
          involvedAddresses.push(arg);
        }
      });
    });
  const uniqueAddresses = _.uniq(involvedAddresses);
  await Promise.all(
    uniqueAddresses.map(
      (address) => module.exports.updateAccountInfo(
        api, client, blockNumber, timestamp, address, loggerOptions,
      ),
    ),
  );
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(loggerOptions, `Updated ${uniqueAddresses.length} accounts in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};

export const updateAccountInfo = async (api: ApiPromise, client: Client, blockNumber: number, timestamp: number, address: Address, loggerOptions: { crawler: string; }) => {
  const [balances, { identity }] = await Promise.all([
    api.derive.balances.all(address),
    api.derive.accounts.info(address),
  ]);
  const availableBalance = balances.availableBalance.toString();
  const freeBalance = balances.freeBalance.toString();
  const lockedBalance = balances.lockedBalance.toString();
  const identityDisplay = identity.display ? identity.display.toString() : '';
  const identityDisplayParent = identity.displayParent ? identity.displayParent.toString() : '';
  const JSONIdentity = identity.display ? JSON.stringify(identity) : '';
  const JSONbalances = JSON.stringify(balances);
  const nonce = balances.accountNonce.toString();
  const data = [
    address,
    JSONIdentity,
    identityDisplay,
    identityDisplayParent,
    JSONbalances,
    availableBalance,
    freeBalance,
    lockedBalance,
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
      $11
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
      nonce = EXCLUDED.nonce,
      timestamp = EXCLUDED.timestamp,
      block_height = EXCLUDED.block_height
    WHERE EXCLUDED.block_height > account.block_height
  ;`;
  try {
    await client.query(query, data);
    logger.debug(loggerOptions, `Updated account info for event/s involved address ${address}`);
  } catch (error) {
    logger.error(loggerOptions, `Error updating account info for event/s involved address: ${JSON.stringify(error)}`);
  }
};

export const processExtrinsics = async (
  api: ApiPromise,
  client: Client,
  blockNumber: number,
  blockHash: BlockHash,
  extrinsics: any[],
  blockEvents: Vec<EventRecord>,
  timestamp: number,
  loggerOptions: { crawler: string; },
) => {
  const startTime = new Date().getTime();
  const indexedExtrinsics = extrinsics.map((extrinsic, index) => ([index, extrinsic]));
  const chunks = module.exports.chunker(indexedExtrinsics, chunkSize);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((indexedExtrinsic: any) => module.exports.processExtrinsic(
        api,
        client,
        blockNumber,
        blockHash,
        indexedExtrinsic,
        blockEvents,
        timestamp,
        loggerOptions,
      )),
    );
  }
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};

export const processExtrinsic = async (
  api: ApiPromise,
  client: Client,
  blockNumber: number,
  blockHash: BlockHash,
  indexedExtrinsic: any,
  blockEvents: Vec<EventRecord>,
  timestamp: number,
  loggerOptions: { crawler: string; },
) => {
  const [index, extrinsic]  = indexedExtrinsic;
  const { isSigned } = extrinsic;
  const signer = isSigned ? extrinsic.signer.toString() : '';
  const section = extrinsic.method.toHuman().section;
  const method = extrinsic.method.toHuman().method;
  const args = JSON.stringify(extrinsic.args);
  const hash = extrinsic.hash.toHex();
  const doc = extrinsic.meta.docs.toString().replace(/'/g, "''");
  // See: https://polkadot.js.org/docs/api/cookbook/blocks/#how-do-i-determine-if-an-extrinsic-succeededfailed
  const [success, errorMessage] = module.exports.getExtrinsicSuccessOrErrorMessage(api, index, blockEvents);
  let feeInfo = '';
  let feeDetails = '';
  if (isSigned) {
    [feeInfo, feeDetails] = await Promise.all([
      api.rpc.payment.queryInfo(extrinsic.toHex(), blockHash)
        .then((result) => JSON.stringify(result.toJSON()))
        .catch((error) => logger.debug(loggerOptions, `API Error: ${error}`)) || '',
      api.rpc.payment.queryFeeDetails(extrinsic.toHex(), blockHash)
        .then((result) => JSON.stringify(result.toJSON()))
        .catch((error) => logger.debug(loggerOptions, `API Error: ${error}`)) || '',
    ]);
  }
  let sql = `INSERT INTO extrinsic (
      block_number,
      extrinsic_index,
      is_signed,
      signer,
      section,
      method,
      args,
      hash,
      doc,
      fee_info,
      fee_details,
      success,
      error_message,
      timestamp
    ) VALUES (
      '${blockNumber}',
      '${index}',
      '${isSigned}',
      '${signer}',
      '${section}',
      '${method}',
      '${args}',
      '${hash}',
      '${doc}',
      '${feeInfo}',
      '${feeDetails}',
      '${success}',
      '${errorMessage}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT extrinsic_pkey 
    DO NOTHING;
    ;`;
  try {
    await client.query(sql);
    logger.debug(loggerOptions, `Added extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
  } catch (error) {
    logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
  }

  if (isSigned) {
    // Store signed extrinsic
    sql = `INSERT INTO signed_extrinsic (
      block_number,
      extrinsic_index,
      signer,
      section,
      method,
      args,
      hash,
      doc,
      fee_info,
      fee_details,
      success,
      error_message,
      timestamp
    ) VALUES (
      '${blockNumber}',
      '${index}',
      '${signer}',
      '${section}',
      '${method}',
      '${args}',
      '${hash}',
      '${doc}',
      '${feeInfo}',
      '${feeDetails}',
      '${success}',
      '${errorMessage}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT signed_extrinsic_pkey 
    DO NOTHING;
    ;`;
    try {
      await client.query(sql);
      logger.debug(loggerOptions, `Added signed extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding signed extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
    }
    if (section === 'balances' && (method === 'forceTransfer' || method === 'transfer' || method === 'transferAll' || method === 'transferKeepAlive')) {
      // Store transfer
      const source = signer;
      const destination = JSON.parse(args)[0].id
        ? JSON.parse(args)[0].id
        : JSON.parse(args)[0].address20;

      let amount = '';
      if (method === 'transferAll') {
        amount = getTransferAllAmount(index, blockEvents);
      } else if (method === 'forceTransfer') {
        amount = JSON.parse(args)[2];
      } else {
        amount = JSON.parse(args)[1]; // 'transfer' and 'transferKeepAlive' methods
      }
      const feeAmount = JSON.parse(feeInfo).partialFee;
      sql = `INSERT INTO transfer (
          block_number,
          extrinsic_index,
          section,
          method,
          hash,
          source,
          destination,
          amount,
          fee_amount,      
          success,
          error_message,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${index}',
          '${section}',
          '${method}',
          '${hash}',
          '${source}',
          '${destination}',
          '${new BigNumber(amount).toString(10)}',
          '${new BigNumber(feeAmount).toString(10)}',
          '${success}',
          '${errorMessage}',
          '${timestamp}'
        )
        ON CONFLICT ON CONSTRAINT transfer_pkey 
        DO NOTHING;
        ;`;
      try {
        await client.query(sql);
        logger.debug(loggerOptions, `Added transfer ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding transfer ${blockNumber}-${index}: ${JSON.stringify(error)}`);
      }
    }
  }
};

export const processEvents = async (
  client: Client, blockNumber: number, blockEvents: Vec<EventRecord>, blockExtrinsics: Vec<GenericExtrinsic<AnyTuple>>, timestamp: number, loggerOptions: { crawler: string; },
) => {
  const startTime = new Date().getTime();
  const indexedBlockEvents = blockEvents.map((event, index) => ([index, event]));
  const chunks = module.exports.chunker(indexedBlockEvents, chunkSize);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((indexedEvent: any) => module.exports.processEvent(
        client, blockNumber, indexedEvent, blockExtrinsics, timestamp, loggerOptions,
      )),
    );
  }
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};

export const processEvent = async (
  client: Client, blockNumber: number, indexedEvent: any, blockExtrinsics: Vec<GenericExtrinsic<AnyTuple>>, timestamp: number, loggerOptions: { crawler: string; },
) => {
  const [index, { event, phase }] = indexedEvent;
  let sql = `INSERT INTO event (
    block_number,
    event_index,
    section,
    method,
    phase,
    data,
    timestamp
  ) VALUES (
    '${blockNumber}',
    '${index}',
    '${event.section}',
    '${event.method}',
    '${phase.toString()}',
    '${JSON.stringify(event.data)}',
    '${timestamp}'
  )
  ON CONFLICT ON CONSTRAINT event_pkey 
  DO NOTHING
  ;`;
  try {
    await client.query(sql);
    logger.debug(loggerOptions, `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
  } catch (error) {
    logger.error(loggerOptions, `Error adding event #${blockNumber}-${index}: ${error}, sql: ${sql}`);
  }

  // Store staking reward
  if (event.section === 'staking' && (event.method === 'Reward' || event.method === 'Rewarded')) {
    // Store validator stash address and era index
    const payoutStakersExtrinsic = blockExtrinsics
      .find(({ method }) => (
        method.section === 'staking'
        && method.method === 'payoutStakers'
      ));
    const validator = payoutStakersExtrinsic.method.args[0];
    const era = payoutStakersExtrinsic.method.args[1];
    sql = `INSERT INTO staking_reward (
      block_number,
      event_index,
      account_id,
      validator_stash_address,
      era,
      amount,
      timestamp
    ) VALUES (
      '${blockNumber}',
      '${index}',
      '${event.data[0]}',
      '${validator}',
      '${era}',
      '${new BigNumber(event.data[1]).toString(10)}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT staking_reward_pkey 
    DO NOTHING
    ;`;
    try {
      await client.query(sql);
      logger.debug(loggerOptions, `Added staking reward #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding staking reward #${blockNumber}-${index}: ${error}, sql: ${sql}`);
    }
  }
  // Store staking slash
  if (event.section === 'staking' && (event.method === 'Slash' || event.method === 'Slashed')) {
    // TODO: also store validator and era index
    sql = `INSERT INTO staking_slash (
      block_number,
      event_index,
      account_id,
      amount,
      timestamp
    ) VALUES (
      '${blockNumber}',
      '${index}',
      '${event.data[0]}',
      '${new BigNumber(event.data[1]).toString(10)}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT staking_slash_pkey 
    DO NOTHING
    ;`;
    try {
      await client.query(sql);
      logger.debug(loggerOptions, `Added staking slash #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding staking slash #${blockNumber}-${index}: ${error}, sql: ${sql}`);
    }
  }
};

export const processLogs = async (client: Client, blockNumber: number, logs: any[], timestamp: number, loggerOptions: { crawler: string; }) => {
  const startTime = new Date().getTime();
  await Promise.all(
    logs.map((log, index) => module.exports.processLog(
      client, blockNumber, log, index, timestamp, loggerOptions,
    )),
  );
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};

export const processLog = async (client: Client, blockNumber: number, log: any, index: number, timestamp: number, loggerOptions: { crawler: string; }) => {
  const { type } = log;
  const [[engine, data]] = Object.values(log.toJSON());
  const sql = `INSERT INTO log (
      block_number,
      log_index,
      type,
      engine,
      data,
      timestamp
    ) VALUES (
      '${blockNumber}',
      '${index}',
      '${type}',
      '${engine}',
      '${data}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT log_pkey 
    DO NOTHING;
    ;`;
  try {
    await client.query(sql);
    logger.debug(loggerOptions, `Added log ${blockNumber}-${index}`);
  } catch (error) {
    logger.error(loggerOptions, `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`);
  }
};

export const getExtrinsicSuccessOrErrorMessage = (api: ApiPromise, index: number, blockEvents: Vec<EventRecord>) => {
  let extrinsicSuccess = false;
  let extrinsicErrorMessage = '';
  blockEvents
    .filter(({ phase }) =>
      phase.isApplyExtrinsic &&
      phase.asApplyExtrinsic.eq(index)
    )
    .forEach(({ event }) => {
      if (api.events.system.ExtrinsicSuccess.is(event)) {
        extrinsicSuccess = true;
      } else if (api.events.system.ExtrinsicFailed.is(event)) {
        // extract the data for this event
        const [dispatchError] = event.data;  
        // decode the error
        if (dispatchError.isModule) {
          // for module errors, we have the section indexed, lookup
          // (For specific known errors, we can also do a check against the
          // api.errors.<module>.<ErrorName>.is(dispatchError.asModule) guard)
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          extrinsicErrorMessage = `${decoded.section}.${decoded.name}`;
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          extrinsicErrorMessage = dispatchError.toString();
        }
      }
    });
  return [extrinsicSuccess, extrinsicErrorMessage];
};

export const getDisplayName = (identity: DeriveAccountRegistration) => {
  if (
    identity.displayParent
    && identity.displayParent !== ''
    && identity.display
    && identity.display !== ''
  ) {
    return `${identity.displayParent} / ${identity.display}`;
  }
  return identity.display || '';
};

// TODO: Investigate https://dzone.com/articles/faster-postgresql-counting
export const updateTotals = async (client: Client, loggerOptions: { crawler: string; }) => {
  await Promise.all([
    module.exports.updateTotalBlocks(client, loggerOptions),
    module.exports.updateTotalExtrinsics(client, loggerOptions),
    module.exports.updateTotalTransfers(client, loggerOptions),
    module.exports.updateTotalEvents(client, loggerOptions),
  ]);
};

export const updateTotalBlocks = async (client: Client, loggerOptions: { crawler: string; }) => {
  const sql = `
    UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks';
  `;
  try {
    await client.query(sql);
  } catch (error) {
    logger.error(loggerOptions, `Error updating totals: ${error}`);
  }
};

export const updateTotalExtrinsics = async (client: Client, loggerOptions: { crawler: string; }) => {
  const sql = `
    UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';
  `;
  try {
    await client.query(sql);
  } catch (error) {
    logger.error(loggerOptions, `Error updating total extrinsics: ${error}`);
  }
};

export const updateTotalTransfers = async (client: Client, loggerOptions: { crawler: string; }) => {
  const sql = `
    UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer' ) WHERE name = 'transfers';
  `;
  try {
    await client.query(sql);
  } catch (error) {
    logger.error(loggerOptions, `Error updating totals transfers ${error}`);
  }
};


export const updateTotalEvents = async (client: Client, loggerOptions: { crawler: string; }) => {
  const sql = `
    UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events';
  `;
  try {
    await client.query(sql);
  } catch (error) {
    logger.error(loggerOptions, `Error updating total events: ${error}`);
  }
};

export const updateFinalized = async (client: Client, finalizedBlock: number, loggerOptions: { crawler: string; }) => {
  const sql = `
    UPDATE block SET finalized = true WHERE finalized = false AND block_number <= ${finalizedBlock};
  `;
  try {
    await client.query(sql);
  } catch (error) {
    logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
  }
};

export const logHarvestError = async (client: Client, blockNumber: number, error: any, loggerOptions: { crawler: string; }) => {
  const timestamp = new Date().getTime();
  const errorString = error.toString().replace(/'/g, "''");
  const data = [
    blockNumber,
    errorString,
    timestamp,
  ];
  const query = `
    INSERT INTO
      harvest_error (block_number, error, timestamp)
    VALUES
      ($1, $2, $3)
    ON CONFLICT ON CONSTRAINT
      harvest_error_pkey 
      DO NOTHING
    ;`;
  await module.exports.dbParamQuery(client, query, data, loggerOptions);
};

export const chunker = (a: any[], n: number) => Array.from(
  { length: Math.ceil(a.length / n) },
  (_, i) => a.slice(i * n, i * n + n),
);

export const getTransferAllAmount = (index: number, blockEvents: any[]) => JSON.stringify(
  blockEvents
    .find(({ event, phase }: any) => (
      (phase.toJSON()?.ApplyExtrinsic === index || phase.toJSON()?.applyExtrinsic === index)
        && event.section === 'balances'
        && event.method === 'Transfer'
    )).event.data.toJSON()[2] || '',
);

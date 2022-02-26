// @ts-check
import * as Sentry from '@sentry/node';
import '@polkadot/api-augment';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';
import { BlockHash, EventRecord, EraIndex } from '@polkadot/types/interfaces';
import { DeriveAccountRegistration } from '@polkadot/api-derive/types';
import { AnyTuple } from '@polkadot/types/types';
import { GenericExtrinsic, Vec } from '@polkadot/types';
import axios from 'axios';
import pino from 'pino';
import { Client, QueryResult } from 'pg';
import _ from 'lodash';
import fs from 'fs';
import { BigNumber } from 'bignumber.js';
import { chunker, range, reverseRange, shortHash } from './utils';
import { backendConfig } from '../backend.config';
import { ApiDecoration } from '@polkadot/api/types';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

const logger = pino({
  level: backendConfig.logLevel,
});

// Used for processing events and extrinsics
const chunkSize = 100;

type indexedBlockEvent = [number, EventRecord];
type indexedBlockExtrinsic = [number, GenericExtrinsic<AnyTuple>];

export const getPolkadotAPI = async (loggerOptions: { crawler: string; }, apiCustomTypes: string | undefined): Promise<ApiPromise> => {
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

export const isNodeSynced = async (api: ApiPromise, loggerOptions: { crawler: string; }): Promise<boolean> => {
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

export const getClient = async (loggerOptions: { crawler: string; }): Promise<Client> => {
  logger.debug(loggerOptions, `Connecting to DB ${backendConfig.postgresConnParams.database} at ${backendConfig.postgresConnParams.host}:${backendConfig.postgresConnParams.port}`);
  const client = new Client(backendConfig.postgresConnParams);
  await client.connect();
  return client;
};

export const dbQuery = async (client: Client, sql: string, loggerOptions: { crawler: string; }): Promise<QueryResult<any>> | null => {
  try {
    return await client.query(sql);
  } catch (error) {
    logger.error(loggerOptions, `SQL: ${sql} ERROR: ${JSON.stringify(error)}`);
    Sentry.captureException(error);
  }
  return null;
};

export const dbParamQuery = async (client: Client, sql: string, data: any[], loggerOptions: { crawler: string; }): Promise<QueryResult<any>> | null => {
  try {
    return await client.query(sql, data);
  } catch (error) {
    logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
    Sentry.captureException(error);
  }
  return null;
};

export const isValidAddressPolkadotAddress = (address: string): boolean => {
  try {
    encodeAddress(
      isHex(address)
        ? hexToU8a(address.toString())
        : decodeAddress(address),
    );
    return true;
  } catch (error) {
    Sentry.captureException(error);
    return false;
  }
};

export const updateAccountsInfo = async (api: ApiPromise, client: Client, blockNumber: number, timestamp: number, loggerOptions: { crawler: string; }, blockEvents: Vec<EventRecord>) => {
  const startTime = new Date().getTime();
  const involvedAddresses: string[] = [];
  blockEvents
    .forEach(({ event }: EventRecord) => {
      const types = event.typeDef;
      event.data.forEach((data, index) => {
        if (types[index].type === 'AccountId32') {
          involvedAddresses.push(data.toString());
        }
      });
    });
  const uniqueAddresses = _.uniq(involvedAddresses);
  await Promise.all(
    uniqueAddresses.map(
      (address) => updateAccountInfo(
        api, client, blockNumber, timestamp, address, loggerOptions,
      ),
    ),
  );
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(loggerOptions, `Updated ${uniqueAddresses.length} accounts in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};

export const updateAccountInfo = async (api: ApiPromise, client: Client, blockNumber: number, timestamp: number, address: string, loggerOptions: { crawler: string; }) => {
  const [balances, { identity }] = await Promise.all([
    api.derive.balances.all(address),
    api.derive.accounts.info(address),
  ]);
  const accountId = balances.accountId.toHuman(); // ImOnline.HeartbeatReceived events return public key addresses but we want SS58 encoded address
  const availableBalance = balances.availableBalance.toString();
  const freeBalance = balances.freeBalance.toString();
  const lockedBalance = balances.lockedBalance.toString();
  const identityDisplay = identity.display ? identity.display.toString() : '';
  const identityDisplayParent = identity.displayParent ? identity.displayParent.toString() : '';
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
    Sentry.captureException(error);
  }
};

export const processExtrinsics = async (
  api: ApiPromise,
  apiAt: ApiDecoration<"promise">,
  client: Client,
  blockNumber: number,
  blockHash: BlockHash,
  extrinsics: Vec<GenericExtrinsic<AnyTuple>>,
  blockEvents: Vec<EventRecord>,
  timestamp: number,
  loggerOptions: { crawler: string; },
) => {
  const startTime = new Date().getTime();
  const indexedExtrinsics: indexedBlockExtrinsic[] = extrinsics.map((extrinsic, index) => ([index, extrinsic]));
  const chunks = chunker(indexedExtrinsics, chunkSize);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((indexedExtrinsic: indexedBlockExtrinsic) => processExtrinsic(
        api,
        apiAt,
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
  apiAt: ApiDecoration<"promise">,
  client: Client,
  blockNumber: number,
  blockHash: BlockHash,
  indexedExtrinsic: indexedBlockExtrinsic,
  blockEvents: Vec<EventRecord>,
  timestamp: number,
  loggerOptions: { crawler: string; },
) => {
  const [extrinsicIndex, extrinsic] = indexedExtrinsic;
  const { isSigned } = extrinsic;
  const signer = isSigned ? extrinsic.signer.toString() : '';
  const section = extrinsic.method.section;
  const method = extrinsic.method.method;
  const args = JSON.stringify(extrinsic.args);
  const hash = extrinsic.hash.toHex();
  const doc = extrinsic.meta.docs.toString().replace(/'/g, "''");
  // See: https://polkadot.js.org/docs/api/cookbook/blocks/#how-do-i-determine-if-an-extrinsic-succeededfailed
  const [success, errorMessage] = getExtrinsicSuccessOrErrorMessage(apiAt, extrinsicIndex, blockEvents);
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
  const data = [
    blockNumber,
    extrinsicIndex,
    isSigned,
    signer,
    section,
    method,
    args,
    hash,
    doc,
    feeInfo,
    feeDetails,
    success,
    errorMessage,
    timestamp
  ];
  const sql = `INSERT INTO extrinsic (
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
      $14
    )
    ON CONFLICT ON CONSTRAINT extrinsic_pkey 
    DO NOTHING;
    ;`;
  try {
    await client.query(sql, data);
    logger.debug(loggerOptions, `Added extrinsic ${blockNumber}-${extrinsicIndex} (${shortHash(hash)}) ${section} ➡ ${method}`);
  } catch (error) {
    logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }

  if (isSigned) {
    const data = [
      blockNumber,
      extrinsicIndex,
      signer,
      section,
      method,
      args,
      hash,
      doc,
      feeInfo,
      feeDetails,
      success,
      errorMessage,
      timestamp
    ];
    // Store signed extrinsic
    const sql = `INSERT INTO signed_extrinsic (
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
    ON CONFLICT ON CONSTRAINT signed_extrinsic_pkey 
    DO NOTHING;
    ;`;
    try {
      await client.query(sql, data);
      logger.debug(loggerOptions, `Added signed extrinsic ${blockNumber}-${extrinsicIndex} (${shortHash(hash)}) ${section} ➡ ${method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding signed extrinsic ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
      Sentry.captureException(error);
    }
    if (section === 'balances' && (method === 'forceTransfer' || method === 'transfer' || method === 'transferAll' || method === 'transferKeepAlive')) {
      // Store transfer
      processTransfer(
        client,
        blockNumber,
        extrinsicIndex,
        blockEvents,
        section,
        method,
        args,
        hash.toString(),
        signer,
        feeInfo,
        success,
        errorMessage,
        timestamp,
        loggerOptions
      );
    }
  }
};

// TODO: Use in multiple extrinsics included in utility.batch and proxy.proxy
export const processTransfer = async (
  client: Client,
  blockNumber: number,
  extrinsicIndex: number,
  blockEvents: Vec<EventRecord>,
  section: string,
  method: string,
  args: string,
  hash: string,
  signer: any,
  feeInfo: string,
  success: boolean,
  errorMessage: string,
  timestamp: number,
  loggerOptions: { crawler: string; }
) => {
  // Store transfer
  const source = signer;
  const destination = JSON.parse(args)[0].id
    ? JSON.parse(args)[0].id
    : JSON.parse(args)[0].address20;

  let amount;
  if (method === 'transferAll' && success) {
    amount = getTransferAllAmount(blockNumber, extrinsicIndex, blockEvents);
  } else if (method === 'transferAll' && !success) {
    // We can't get amount in this case cause no event is emitted
    amount = 0;
  } else if (method === 'forceTransfer') {
    amount = JSON.parse(args)[2];
  } else {
    amount = JSON.parse(args)[1]; // 'transfer' and 'transferKeepAlive' methods
  }
  const feeAmount = JSON.parse(feeInfo).partialFee;
  const data = [
    blockNumber,
    extrinsicIndex,
    section,
    method,
    hash,
    source,
    destination,
    new BigNumber(amount).toString(10),
    new BigNumber(feeAmount).toString(10),
    success,
    errorMessage,
    timestamp
  ];
  const sql = `INSERT INTO transfer (
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
      $12
    )
    ON CONFLICT ON CONSTRAINT transfer_pkey 
    DO NOTHING;
    ;`;
  try {
    await client.query(sql, data);
    logger.debug(loggerOptions, `Added transfer ${blockNumber}-${extrinsicIndex} (${shortHash(hash.toString())}) ${section} ➡ ${method}`);
  } catch (error) {
    logger.error(loggerOptions, `Error adding transfer ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }
};

export const processEvents = async (
  client: Client,
  blockNumber: number,
  activeEra: number,
  blockEvents: Vec<EventRecord>,
  blockExtrinsics: Vec<GenericExtrinsic<AnyTuple>>,
  timestamp: number,
  loggerOptions: { crawler: string; },
) => {
  const startTime = new Date().getTime();
  const indexedBlockEvents: indexedBlockEvent[] = blockEvents.map((event, index) => ([index, event]));
  const indexedBlockExtrinsics: indexedBlockExtrinsic[] = blockExtrinsics.map((extrinsic, index) => ([index, extrinsic]));
  const chunks = chunker(indexedBlockEvents, chunkSize);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((indexedEvent: indexedBlockEvent) => processEvent(
        client, blockNumber, activeEra, indexedEvent, indexedBlockEvents, indexedBlockExtrinsics, timestamp, loggerOptions,
      )),
    );
  }
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};

export const processEvent = async (
  client: Client,
  blockNumber: number,
  activeEra: number,
  indexedEvent: indexedBlockEvent,
  indexedBlockEvents: indexedBlockEvent[],
  indexedBlockExtrinsics: indexedBlockExtrinsic[],
  timestamp: number,
  loggerOptions: { crawler: string; },
) => {
  const [eventIndex, { event, phase }] = indexedEvent;
  const data = [
    blockNumber,
    eventIndex,
    event.section,
    event.method,
    phase.toString(),
    JSON.stringify(event.data),
    timestamp
  ];
  const sql = `INSERT INTO event (
    block_number,
    event_index,
    section,
    method,
    phase,
    data,
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
  ON CONFLICT ON CONSTRAINT event_pkey 
  DO NOTHING
  ;`;
  try {
    await client.query(sql, data);
    logger.debug(loggerOptions, `Added event #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
  } catch (error) {
    logger.error(loggerOptions, `Error adding event #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
    Sentry.captureException(error);
  }

  // Store staking reward
  if (event.section === 'staking' && (event.method === 'Reward' || event.method === 'Rewarded')) {

    //
    // Store validator stash address and era index
    //

    let validator = null;
    let era = null;
    let sql;
    let data = [];

    const payoutStakersExtrinsic = indexedBlockExtrinsics
      .find(([extrinsicIndex, { method: { section, method } }]) => (
        phase.asApplyExtrinsic.eq(extrinsicIndex) // event phase
        && section === 'staking'
        && method === 'payoutStakers'
      ));

    if (payoutStakersExtrinsic) {
      validator = payoutStakersExtrinsic[1].method.args[0];
      era = payoutStakersExtrinsic[1].method.args[1];
    } else {

      // TODO: support era/validator extraction for staking.payoutValidator and staking.payoutNominator

      //
      // staking.payoutStakers extrinsic included in a utility.batch or utility.batchAll extrinsic
      //
      const utilityBatchExtrinsicIndexes = indexedBlockExtrinsics
        .filter(([extrinsicIndex, extrinsic]) => (
          phase.asApplyExtrinsic.eq(extrinsicIndex) // event phase
          && extrinsic.method.section === 'utility'
          && (extrinsic.method.method === 'batch' || extrinsic.method.method === 'batchAll')
        ))
        .map(([index, _]) => index);

      if (utilityBatchExtrinsicIndexes.length > 0) {
        // We know that utility.batch has some staking.payoutStakers extrinsic
        // Then we need to do a lookup of the previous staking.payoutStarted 
        // event to get validator and era
        const payoutStartedEvents = indexedBlockEvents.filter(([_, record]) => (
          record.phase.isApplyExtrinsic
          && utilityBatchExtrinsicIndexes.includes(record.phase.asApplyExtrinsic.toNumber()) // events should be related to utility.batch extrinsic
          && record.event.section === 'staking'
          && record.event.method === 'PayoutStarted'
        )).reverse();
        if (payoutStartedEvents) {
          const payoutStartedEvent = payoutStartedEvents.find(([index, _]) => index < eventIndex);
          if (payoutStartedEvent) {
            [era, validator] = payoutStartedEvent[1].event.data
          }
        }
      } else {

        //
        // staking.payoutStakers extrinsic included in a proxy.proxy extrinsic
        //
        const proxyProxyExtrinsicIndexes = indexedBlockExtrinsics
          .filter(([extrinsicIndex, extrinsic]) => (
            phase.asApplyExtrinsic.eq(extrinsicIndex) // event phase
            && extrinsic.method.section === 'proxy'
            && extrinsic.method.method === 'proxy'
          ))
          .map(([index, _]) => index);

        if (proxyProxyExtrinsicIndexes.length > 0) {
          // We know that proxy.proxy has some staking.payoutStakers extrinsic
          // Then we need to do a lookup of the previous staking.payoutStarted 
          // event to get validator and era
          const payoutStartedEvents = indexedBlockEvents.filter(([_, record]) => (
            record.phase.isApplyExtrinsic
            && proxyProxyExtrinsicIndexes.includes(record.phase.asApplyExtrinsic.toNumber()) // events should be related to proxy.proxy extrinsic
            && record.event.section === 'staking'
            && record.event.method === 'PayoutStarted'
          )).reverse();
          if (payoutStartedEvents) {
            const payoutStartedEvent = payoutStartedEvents.find(([index, _]) => index < eventIndex);
            if (payoutStartedEvent) {
              [era, validator] = payoutStartedEvent[1].event.data
            }
          }
        }
      }
    }

    if (validator && era) {
      data = [
        blockNumber,
        eventIndex,
        event.data[0].toString(),
        validator.toString(),
        era,
        new BigNumber(event.data[1].toString()).toString(10),
        timestamp
      ];
      sql = `INSERT INTO staking_reward (
        block_number,
        event_index,
        account_id,
        validator_stash_address,
        era,
        amount,
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
      ON CONFLICT ON CONSTRAINT staking_reward_pkey 
      DO NOTHING
      ;`;
    } else {
      data = [
        blockNumber,
        eventIndex,
        event.data[0].toString(),
        new BigNumber(event.data[1].toString()).toString(10),
        timestamp
      ];
      sql = `INSERT INTO staking_reward (
        block_number,
        event_index,
        account_id,
        amount,
        timestamp
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5
      )
      ON CONFLICT ON CONSTRAINT staking_reward_pkey 
      DO NOTHING
      ;`;
    }
    try {
      await client.query(sql, data);
      logger.debug(loggerOptions, `Added staking reward #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding staking reward #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
      const scope = new Sentry.Scope();
      scope.setTag('blockNumber', blockNumber);
      Sentry.captureException(error, scope);
    }
  }


  //
  // TODO: store validator and era index
  // -> era is previous era
  // -> validator account id is in staking.Slashed event
  //

  // Store validator staking slash
  if (event.section === 'staking' && (event.method === 'Slash' || event.method === 'Slashed')) {
    const data = [
      blockNumber,
      eventIndex,
      event.data[0].toString(),
      event.data[0].toString(),
      activeEra - 1,
      new BigNumber(event.data[1].toString()).toString(10),
      timestamp
    ];
    const sql = `INSERT INTO staking_slash (
      block_number,
      event_index,
      account_id,
      validator_stash_address,
      era,
      amount,
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
    ON CONFLICT ON CONSTRAINT staking_slash_pkey 
    DO NOTHING
    ;`;
    try {
      await client.query(sql, data);
      logger.debug(loggerOptions, `Added validator staking slash #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding validator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
      Sentry.captureException(error);
    }
  }

  // Store nominator staking slash
  if (event.section === 'balances' && (event.method === 'Slash' || event.method === 'Slashed')) {
    const validator_stash_address = getSlashedValidatorAccount(eventIndex, indexedBlockEvents);
    const data = [
      blockNumber,
      eventIndex,
      event.data[0].toString(),
      validator_stash_address,
      activeEra - 1,
      new BigNumber(event.data[1].toString()).toString(10),
      timestamp
    ];
    const sql = `INSERT INTO staking_slash (
      block_number,
      event_index,
      account_id,
      validator_stash_address,
      era,
      amount,
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
    ON CONFLICT ON CONSTRAINT staking_slash_pkey 
    DO NOTHING
    ;`;
    try {
      await client.query(sql, data);
      logger.debug(loggerOptions, `Added nominator staking slash #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding nominator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
      const scope = new Sentry.Scope();
      scope.setTag('blockNumber', blockNumber);
      Sentry.captureException(error, scope);
    }
  }
};

export const processLogs = async (client: Client, blockNumber: number, logs: any[], timestamp: number, loggerOptions: { crawler: string; }) => {
  const startTime = new Date().getTime();
  await Promise.all(
    logs.map((log, index) => processLog(
      client, blockNumber, log, index, timestamp, loggerOptions,
    )),
  );
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};

export const processLog = async (client: Client, blockNumber: number, log: any, index: number, timestamp: number, loggerOptions: { crawler: string; }) => {
  const { type } = log;
  const [[engine, logData]] = Object.values(log.toHuman());
  const data = [
    blockNumber,
    index,
    type,
    engine,
    logData,
    timestamp
  ];
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
    logger.error(loggerOptions, `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`);
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }
};

export const getExtrinsicSuccessOrErrorMessage = (apiAt: ApiDecoration<"promise">, index: number, blockEvents: Vec<EventRecord>): [boolean, string] => {
  let extrinsicSuccess = false;
  let extrinsicErrorMessage = '';
  blockEvents
    .filter(({ phase }) =>
      phase.isApplyExtrinsic &&
      phase.asApplyExtrinsic.eq(index)
    )
    .forEach(({ event }) => {
      if (apiAt.events.system.ExtrinsicSuccess.is(event)) {
        extrinsicSuccess = true;
      } else if (apiAt.events.system.ExtrinsicFailed.is(event)) {
        const [dispatchError] = event.data;
        if (dispatchError.isModule) {
          const decoded = apiAt.registry.findMetaError(dispatchError.asModule);
          extrinsicErrorMessage = `${decoded.name}: ${decoded.docs}`;
        } else {
          extrinsicErrorMessage = dispatchError.toString();
        }
      }
    });
  return [extrinsicSuccess, extrinsicErrorMessage];
};

export const getDisplayName = (identity: DeriveAccountRegistration): string => {
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

export const updateFinalized = async (client: Client, finalizedBlock: number, loggerOptions: { crawler: string; }) => {
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
  await dbParamQuery(client, query, data, loggerOptions);
};

// TODO: Figure out what happens when the extrinsic balances.transferAll is included in a utility.batch or proxy.proxy extrinsic
export const getTransferAllAmount = (blockNumber: number, index: number, blockEvents: Vec<EventRecord>): string => {
  try {
    return blockEvents
      .find(({ event, phase }) => (
        phase.isApplyExtrinsic
        && phase.asApplyExtrinsic.eq(index)
        && event.section === 'balances'
        && event.method === 'Transfer'
      )).event.data[2].toString();
  } catch (error) {
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  } finally {
    return '0';
  }
}


export const getSlashedValidatorAccount = (index: number, indexedBlockEvents: indexedBlockEvent[]): string => {
  let validatorAccountId = '';
  for (let i = index; i >= 0; i--) {
    const { event } = indexedBlockEvents[i][1];
    if (event.section === 'staking' && (event.method === 'Slash' || event.method === 'Slashed')) {
      return validatorAccountId = event.data[0].toString();
    }
  }
  return validatorAccountId;
}

export const healthCheck = async (config: any, client: Client, loggerOptions: { crawler: string; }) => {
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
    logger.info(loggerOptions, `Health check failed for block #${row.block_number}, deleting block from block table!`);
    await dbQuery(client, `DELETE FROM block WHERE block_number = '${row.block_number}';`, loggerOptions);
  }
  const endTime = new Date().getTime();
  logger.debug(loggerOptions, `Health check finished in ${((endTime - startTime) / 1000).toFixed(config.statsPrecision)}s`);
};

export const harvestBlock = async (config: any, api: ApiPromise, client: Client, blockNumber: number, loggerOptions: { crawler: string; }) => {
  const startTime = new Date().getTime();
  try {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);

    const apiAt = await api.at(blockHash);
    const [
      { block },
      blockEvents,
      blockHeader,
      totalIssuance,
      runtimeVersion,
      activeEra,
      currentIndex,
      chainElectionStatus,
      timestamp,
    ] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      apiAt.query.system.events(),
      api.derive.chain.getHeader(blockHash),
      apiAt.query.balances.totalIssuance(),
      api.rpc.state.getRuntimeVersion(blockHash),
      apiAt.query.staking.activeEra()
        .then((res: any) => (res.toJSON() ? res.toJSON().index : 0))
        .catch((e) => { console.log(e); return 0 }),
      apiAt.query.session.currentIndex()
        .then((res) => (res || 0)),
      apiAt.query.electionProviderMultiPhase.currentPhase(),
      apiAt.query.timestamp.now(),
    ]);

    const blockAuthor = blockHeader.author || '';
    const blockAuthorIdentity = await api.derive.accounts.info(blockHeader.author);
    const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
    const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;
    // Get election status
    const isElection = Object.getOwnPropertyNames(chainElectionStatus.toJSON())[0] !== 'off';

    // Totals
    const totalEvents = blockEvents.length;
    const totalExtrinsics = block.extrinsics.length;

    const data = [
      blockNumber,
      false,
      blockAuthor.toString(),
      blockAuthorName,
      blockHash.toString(),
      parentHash.toString(),
      extrinsicsRoot.toString(),
      stateRoot.toString(),
      activeEra,
      currentIndex,
      isElection,
      runtimeVersion.specVersion,
      totalEvents,
      totalExtrinsics,
      totalIssuance.toString(),
      timestamp
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
        is_election,
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
        $15,
        $16
      )
      ON CONFLICT ON CONSTRAINT block_pkey 
      DO NOTHING
      ;`;
    try {
      await dbParamQuery(client, sql, data, loggerOptions);
      const endTime = new Date().getTime();
      logger.debug(loggerOptions, `Added block #${blockNumber} (${shortHash(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(config.statsPrecision)}s`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
      const scope = new Sentry.Scope();
      scope.setTag('blockNumber', blockNumber);
      Sentry.captureException(error, scope);
    }

    // Runtime upgrade
    const runtimeUpgrade = blockEvents
      .find(({ event }) => apiAt.events.system.CodeUpdated.is(event));
    if (runtimeUpgrade) {
      const specName = runtimeVersion.toJSON().specName;
      const specVersion = runtimeVersion.specVersion;
      
      // TODO: enable again
      // see: https://github.com/polkadot-js/api/issues/4596
      // const metadata = await api.rpc.state.getMetadata(blockHash);
      
      await storeMetadata(client, blockNumber, blockHash.toString(), specName.toString(), specVersion.toNumber(), timestamp.toNumber(), loggerOptions);
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
        timestamp.toNumber(),
        loggerOptions,
      ),
      // Store module events
      processEvents(
        client,
        blockNumber,
        parseInt(activeEra.toString()),
        blockEvents,
        block.extrinsics,
        timestamp.toNumber(),
        loggerOptions,
      ),
      // Store block logs
      processLogs(
        client,
        blockNumber,
        blockHeader.digest.logs,
        timestamp.toNumber(),
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
export const harvestBlocksSeq = async (config: any, api: ApiPromise, client: Client, startBlock: number, endBlock: number, loggerOptions: { crawler: string; }) => {
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
    avgTimeMs = blockProcessingTimes.reduce(
      (sum, blockProcessingTime) => sum + blockProcessingTime, 0,
    ) / blockProcessingTimes.length;
    const completed = ((blocks.indexOf(blockNumber) + 1) * 100) / blocks.length;

    logger.info(loggerOptions, `Processed block #${blockNumber} ${blocks.indexOf(blockNumber) + 1}/${blocks.length} [${completed.toFixed(config.statsPrecision)}%] in ${((blockProcessingTimeMs) / 1000).toFixed(config.statsPrecision)}s min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)}`);
  }
};

export const harvestBlocks = async (config: any, api: ApiPromise, client: Client, startBlock: number, endBlock: number, loggerOptions: { crawler: string; }) => {
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
      chunk.map(
        (blockNumber: number) => harvestBlock(config, api, client, blockNumber, loggerOptions),
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
    avgTimeMs = chunkProcessingTimes.reduce(
      (sum, chunkProcessingTime) => sum + chunkProcessingTime, 0,
    ) / chunkProcessingTimes.length;
    avgBlocksPerSecond = 1 / ((avgTimeMs / 1000) / config.chunkSize);
    const currentBlocksPerSecond = 1 / ((chunkProcessingTimeMs / 1000) / config.chunkSize);
    const completed = ((chunks.indexOf(chunk) + 1) * 100) / chunks.length;

    logger.info(
      loggerOptions,
      `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} [${completed.toFixed(config.statsPrecision)}%] `
      + `in ${((chunkProcessingTimeMs) / 1000).toFixed(config.statsPrecision)}s `
      + `min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)} `
      + `cur/avg bps: ${currentBlocksPerSecond.toFixed(config.statsPrecision)}/${avgBlocksPerSecond.toFixed(config.statsPrecision)}`,
    );
  }
};

export const storeMetadata = async (
  client: Client,
  blockNumber: number,
  blockHash: string,
  specName: string,
  specVersion: number,
  timestamp: number,
  loggerOptions: { crawler: string; }
) => {
  let metadata;
  try {
    const response = await axios.get(`${backendConfig.substrateApiSidecar}/runtime/metadata?at=${blockHash}`);
    metadata = response.data;
    logger.debug(loggerOptions, `Got runtime metadata at ${blockHash}!`);
  } catch (error) {
    logger.error(loggerOptions, `Error fetching runtime metadata at ${blockHash}: ${JSON.stringify(error)}`);
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
}

export const getAccountIdFromArgs = (account: any[]) => account
  .map(({ args }) => args)
  .map(([e]) => e.toHuman());

export const fetchAccountIds = async (api: ApiPromise) => getAccountIdFromArgs(await api.query.system.account.keys());

export const processAccountsChunk = async (api: ApiPromise, client: Client, accountId: any, loggerOptions: { crawler: string; }) => {
  const timestamp = Math.floor(parseInt(Date.now().toString(), 10) / 1000);
  const [block, identity, balances] = await Promise.all([
    api.rpc.chain.getBlock().then((result) => result.block.header.number.toNumber()),
    api.derive.accounts.identity(accountId),
    api.derive.balances.all(accountId),
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
    accountId,
    JSONIdentity,
    identityDisplay,
    identityDisplayParent,
    JSONbalances,
    availableBalance,
    freeBalance,
    lockedBalance,
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
  await dbParamQuery(client, query, data, loggerOptions);
};

//
// staking
//

export const getThousandValidators = async (loggerOptions: { crawler: string; }) => {
  try {
    const response = await axios.get('https://kusama.w3f.community/candidates');
    return response.data;
  } catch (error) {
    logger.error(loggerOptions, `Error fetching Thousand Validator Program stats: ${JSON.stringify(error)}`);
    Sentry.captureException(error);
    return [];
  }
};

export const isVerifiedIdentity = (identity: DeriveAccountRegistration) => {
  if (identity.judgements.length === 0) {
    return false;
  }
  return identity.judgements
    .filter(([, judgement]) => !judgement.isFeePaid)
    .some(([, judgement]) => judgement.isKnownGood || judgement.isReasonable);
};

export const getName = (identity: DeriveAccountRegistration) => {
  if (
    identity.displayParent
    && identity.displayParent !== ''
    && identity.display
    && identity.display !== ''
  ) {
    return `${identity.displayParent}/${identity.display}`;
  }
  return identity.display || '';
};

export const getClusterName = (identity: DeriveAccountRegistration) => identity.displayParent || '';

export const subIdentity = (identity: DeriveAccountRegistration) => {
  if (
    identity.displayParent
    && identity.displayParent !== ''
    && identity.display
    && identity.display !== ''
  ) {
    return true;
  }
  return false;
};

export const getIdentityRating = (name: string, verifiedIdentity: boolean, hasAllFields: any) => {
  if (verifiedIdentity && hasAllFields) {
    return 3;
  } if (verifiedIdentity && !hasAllFields) {
    return 2;
  } if (name !== '') {
    return 1;
  }
  return 0;
};

export const parseIdentity = (identity: DeriveAccountRegistration) => {
  const verifiedIdentity = isVerifiedIdentity(identity);
  const hasSubIdentity = subIdentity(identity);
  const name = getName(identity);
  const hasAllFields = identity.display
    && identity.legal
    && identity.web
    && identity.email
    && identity.twitter
    && identity.riot;
  const identityRating = getIdentityRating(name, verifiedIdentity, hasAllFields);
  return {
    verifiedIdentity,
    hasSubIdentity,
    name,
    identityRating,
  };
};

export const getCommissionHistory = (accountId: string | number, erasPreferences: any[]) => {
  const commissionHistory: any = [];
  erasPreferences.forEach(({ era, validators }) => {
    if (validators[accountId]) {
      commissionHistory.push({
        era: new BigNumber(era.toString()).toString(10),
        commission: (validators[accountId].commission / 10000000).toFixed(2),
      });
    } else {
      commissionHistory.push({
        era: new BigNumber(era.toString()).toString(10),
        commission: null,
      });
    }
  });
  return commissionHistory;
};

export const getCommissionRating = (commission: number, commissionHistory: any[]) => {
  if (commission !== 100 && commission !== 0) {
    if (commission > 10) {
      return 1;
    }
    if (commission >= 5) {
      if (
        commissionHistory.length > 1
        && commissionHistory[0] > commissionHistory[commissionHistory.length - 1]
      ) {
        return 3;
      }
      return 2;
    }
    if (commission < 5) {
      return 3;
    }
  }
  return 0;
};

export const getPayoutRating = (config: any, payoutHistory: any[]) => {
  const pendingEras = payoutHistory.filter((era) => era.status === 'pending').length;
  if (pendingEras <= config.erasPerDay) {
    return 3;
  } if (pendingEras <= 3 * config.erasPerDay) {
    return 2;
  } if (pendingEras < 7 * config.erasPerDay) {
    return 1;
  }
  return 0;
};

export const getClusterInfo = (hasSubIdentity: boolean, validators: any[], validatorIdentity: DeriveAccountRegistration) => {
  if (!hasSubIdentity) {
    // string detection
    // samples: DISC-SOFT-01, BINANCE_KSM_9, SNZclient-1
    if (validatorIdentity.display) {
      const stringSize = 6;
      const clusterMembers = validators.filter(
        ({ identity }) => (identity.display || '').substring(0, stringSize)
          === validatorIdentity.display.substring(0, stringSize),
      ).length;
      const clusterName = validatorIdentity.display
        .replace(/\d{1,2}$/g, '')
        .replace(/-$/g, '')
        .replace(/_$/g, '');
      return {
        clusterName,
        clusterMembers,
      };
    }
    return {
      clusterName: '',
      clusterMembers: 0,
    };
  }

  const clusterMembers = validators.filter(
    ({ identity }) => identity.displayParent === validatorIdentity.displayParent,
  ).length;
  const clusterName = getClusterName(validatorIdentity);
  return {
    clusterName,
    clusterMembers,
  };
};

export const addNewFeaturedValidator = async (config: any, client: Client, ranking: any[], loggerOptions: { crawler: string; }) => {
  // rules:
  // - maximum commission is 10%
  // - at least 20 KSM own stake
  // - no previously featured

  // get previously featured
  const alreadyFeatured: any = [];
  const sql = 'SELECT stash_address, timestamp FROM featured';
  const res = await dbQuery(client, sql, loggerOptions);
  res.rows.forEach((validator) => alreadyFeatured.push(validator.stash_address));
  // get candidates that meet the rules
  const featuredCandidates = ranking
    .filter((validator) => validator.commission <= 10
      && validator.selfStake.div(10 ** config.tokenDecimals).gte(20)
      && !validator.active && !alreadyFeatured.includes(validator.stashAddress))
    .map(({ rank }) => rank);
  // get random featured validator of the week
  const shuffled = [...featuredCandidates].sort(() => 0.5 - Math.random());
  const randomRank = shuffled[0];
  const featured = ranking.find((validator) => validator.rank === randomRank);
  await dbQuery(
    client,
    `INSERT INTO featured (stash_address, name, timestamp) VALUES ('${featured.stashAddress}', '${featured.name}', '${new Date().getTime()}')`,
    loggerOptions,
  );
  logger.debug(loggerOptions, `New featured validator added: ${featured.name} ${featured.stashAddress}`);
};

export const insertRankingValidator = async (client: Client, validator: any, blockHeight: number, startTime: number, loggerOptions: { crawler: string; }) => {
  const sql = `INSERT INTO ranking (
      block_height,
      rank,
      active,
      active_rating,
      name,
      identity,
      has_sub_identity,
      sub_accounts_rating,
      verified_identity,
      identity_rating,
      stash_address,
      stash_address_creation_block,
      stash_parent_address_creation_block,
      address_creation_rating,
      controller_address,
      included_thousand_validators,
      thousand_validator,
      part_of_cluster,
      cluster_name,
      cluster_members,
      show_cluster_member,
      nominators,
      nominators_rating,
      commission,
      commission_history,
      commission_rating,
      active_eras,
      era_points_history,
      era_points_percent,
      era_points_rating,
      performance,
      performance_history,
      relative_performance,
      relative_performance_history,
      slashed,
      slash_rating,
      slashes,
      council_backing,
      active_in_governance,
      governance_rating,
      payout_history,
      payout_rating,
      self_stake,
      other_stake,
      total_stake,
      stake_history,
      total_rating,
      dominated,
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
      $15,
      $16,
      $17,
      $18,
      $19,
      $20,
      $21,
      $22,
      $23,
      $24,
      $25,
      $26,
      $27,
      $28,
      $29,
      $30,
      $31,
      $32,
      $33,
      $34,
      $35,
      $36,
      $37,
      $38,
      $39,
      $40,
      $41,
      $42,
      $43,
      $44,
      $45,
      $46,
      $47,
      $48,
      $49
    )
    ON CONFLICT ON CONSTRAINT ranking_pkey 
    DO NOTHING`;
  const data = [
    blockHeight,
    validator.rank,
    validator.active,
    validator.activeRating,
    validator.name,
    JSON.stringify(validator.identity),
    validator.hasSubIdentity,
    validator.subAccountsRating,
    validator.verifiedIdentity,
    validator.identityRating,
    validator.stashAddress,
    validator.stashCreatedAtBlock,
    validator.stashParentCreatedAtBlock,
    validator.addressCreationRating,
    validator.controllerAddress,
    validator.includedThousandValidators,
    JSON.stringify(validator.thousandValidator),
    validator.partOfCluster,
    validator.clusterName,
    validator.clusterMembers,
    validator.showClusterMember,
    validator.nominators,
    validator.nominatorsRating,
    validator.commission,
    JSON.stringify(validator.commissionHistory),
    validator.commissionRating,
    validator.activeEras,
    JSON.stringify(validator.eraPointsHistory),
    validator.eraPointsPercent,
    validator.eraPointsRating,
    validator.performance,
    JSON.stringify(validator.performanceHistory),
    validator.relativePerformance,
    JSON.stringify(validator.relativePerformanceHistory),
    validator.slashed,
    validator.slashRating,
    JSON.stringify(validator.slashes),
    validator.councilBacking,
    validator.activeInGovernance,
    validator.governanceRating,
    JSON.stringify(validator.payoutHistory),
    validator.payoutRating,
    validator.selfStake.toString(10),
    validator.otherStake.toString(10),
    validator.totalStake.toString(10),
    JSON.stringify(validator.stakeHistory),
    validator.totalRating,
    validator.dominated,
    startTime,
  ];
  await dbParamQuery(client, sql, data, loggerOptions);
};

export const insertEraValidatorStats = async (client: Client, validator: any, activeEra: any, loggerOptions: { crawler: string; }) => {
  let sql = `INSERT INTO era_vrc_score (
      stash_address,
      era,
      vrc_score
    ) VALUES (
      $1,
      $2,
      $3
    )
    ON CONFLICT ON CONSTRAINT era_vrc_score_pkey 
    DO NOTHING;`;
  let data = [
    validator.stashAddress,
    activeEra,
    validator.totalRating,
  ];
  await dbParamQuery(client, sql, data, loggerOptions);
  for (const commissionHistoryItem of validator.commissionHistory) {
    if (commissionHistoryItem.commission) {
      sql = `INSERT INTO era_commission (
          stash_address,
          era,
          commission
        ) VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT ON CONSTRAINT era_commission_pkey 
        DO NOTHING;`;
      data = [
        validator.stashAddress,
        commissionHistoryItem.era,
        commissionHistoryItem.commission,
      ];
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
  for (const perfHistoryItem of validator.relativePerformanceHistory) {
    if (perfHistoryItem.relativePerformance && perfHistoryItem.relativePerformance > 0) {
      sql = `INSERT INTO era_relative_performance (
          stash_address,
          era,
          relative_performance
        ) VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT ON CONSTRAINT era_relative_performance_pkey 
        DO NOTHING;`;
      data = [
        validator.stashAddress,
        perfHistoryItem.era,
        perfHistoryItem.relativePerformance,
      ];
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
  for (const stakefHistoryItem of validator.stakeHistory) {
    if (stakefHistoryItem.self && stakefHistoryItem.self !== 0) {
      sql = `INSERT INTO era_self_stake (
          stash_address,
          era,
          self_stake
        ) VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT ON CONSTRAINT era_self_stake_pkey 
        DO NOTHING;`;
      data = [
        validator.stashAddress,
        stakefHistoryItem.era,
        stakefHistoryItem.self,
      ];
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
  for (const eraPointsHistoryItem of validator.eraPointsHistory) {
    if (eraPointsHistoryItem.points && eraPointsHistoryItem.points !== 0) {
      sql = `INSERT INTO era_points (
          stash_address,
          era,
          points
        ) VALUES (
          $1,
          $2,
          $3
        )
        ON CONFLICT ON CONSTRAINT era_points_pkey 
        DO NOTHING;`;
      data = [
        validator.stashAddress,
        eraPointsHistoryItem.era,
        eraPointsHistoryItem.points,
      ];
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
};

export const getAddressCreation = async (client: Client, address: any, loggerOptions: { crawler: string; }) => {
  const query = "SELECT block_number FROM event WHERE method = 'NewAccount' AND data LIKE $1";
  const res = await dbParamQuery(client, query, [`%${address}%`], loggerOptions);
  if (res) {
    if (res.rows.length > 0) {
      if (res.rows[0].block_number) {
        return res.rows[0].block_number;
      }
    }
  }
  // if not found we assume that it's included in genesis
  return 0;
};

export const getLastEraInDb = async (client: Client, loggerOptions: { crawler: string; }) => {
  // TODO: check also:
  // era_points_avg, era_relative_performance_avg, era_self_stake_avg
  const query = 'SELECT era FROM era_commission_avg ORDER BY era DESC LIMIT 1';
  const res = await dbQuery(client, query, loggerOptions);
  if (res) {
    if (res.rows.length > 0) {
      if (res.rows[0].era) {
        return res.rows[0].era;
      }
    }
  }
  return 0;
};

export const insertEraValidatorStatsAvg = async (client: Client, eraIndex: EraIndex, loggerOptions: { crawler: string; }) => {
  const era = new BigNumber(eraIndex.toString()).toString(10);
  let data = [era];
  let sql = 'SELECT AVG(commission) AS commission_avg FROM era_commission WHERE era = $1 AND commission != 100';
  let res = await dbParamQuery(client, sql, data, loggerOptions);
  if (res.rows.length > 0) {
    if (res.rows[0].commission_avg) {
      data = [
        era,
        res.rows[0].commission_avg
      ];
      sql = 'INSERT INTO era_commission_avg (era, commission_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_commission_avg_pkey DO NOTHING;';
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
  sql = 'SELECT AVG(self_stake) AS self_stake_avg FROM era_self_stake WHERE era = $1';
  data = [era];
  res = await dbParamQuery(client, sql, data, loggerOptions);
  if (res.rows.length > 0) {
    if (res.rows[0].self_stake_avg) {
      const selfStakeAvg = res.rows[0].self_stake_avg.toString(10).split('.')[0];
      data = [
        era,
        selfStakeAvg
      ];
      sql = 'INSERT INTO era_self_stake_avg (era, self_stake_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_self_stake_avg_pkey DO NOTHING;';
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
  sql = 'SELECT AVG(relative_performance) AS relative_performance_avg FROM era_relative_performance WHERE era = $1';
  data = [era];
  res = await dbParamQuery(client, sql, data, loggerOptions);
  if (res.rows.length > 0) {
    if (res.rows[0].relative_performance_avg) {
      data = [
        era,
        res.rows[0].relative_performance_avg
      ];
      sql = 'INSERT INTO era_relative_performance_avg (era, relative_performance_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_relative_performance_avg_pkey DO NOTHING;';
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
  sql = 'SELECT AVG(points) AS points_avg FROM era_points WHERE era = $1';
  data = [era];
  res = await dbParamQuery(client, sql, data, loggerOptions);
  if (res.rows.length > 0) {
    if (res.rows[0].points_avg) {
      data = [
        era,
        res.rows[0].points_avg
      ];
      sql = 'INSERT INTO era_points_avg (era, points_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_points_avg_pkey DO NOTHING;';
      await dbParamQuery(client, sql, data, loggerOptions);
    }
  }
};
// @ts-check
import * as Sentry from '@sentry/node';
import { EventRecord } from '@polkadot/types/interfaces';
import { AnyTuple } from '@polkadot/types/types';
import { GenericExtrinsic, Vec } from '@polkadot/types';
import { Client } from 'pg';
import { BigNumber } from 'bignumber.js';
import { chunker } from './utils';
import {
  LoggerOptions,
  IndexedBlockEvent,
  IndexedBlockExtrinsic,
} from './types';
import { backendConfig } from '../backend.config';
import { logger } from './logger';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

// events chunk size
const chunkSize = 20;

export const getSlashedValidatorAccount = (
  index: number,
  IndexedBlockEvents: IndexedBlockEvent[],
): string => {
  let validatorAccountId = '';
  for (let i = index; i >= 0; i--) {
    const { event } = IndexedBlockEvents[i][1];
    if (
      event.section === 'staking' &&
      (event.method === 'Slash' || event.method === 'Slashed')
    ) {
      return (validatorAccountId = event.data[0].toString());
    }
  }
  return validatorAccountId;
};

export const processEvent = async (
  client: Client,
  blockNumber: number,
  activeEra: number,
  indexedEvent: IndexedBlockEvent,
  IndexedBlockEvents: IndexedBlockEvent[],
  IndexedBlockExtrinsics: IndexedBlockExtrinsic[],
  timestamp: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const [eventIndex, { event, phase }] = indexedEvent;
  const doc = JSON.stringify(event.meta.docs.toJSON());
  const types = JSON.stringify(event.typeDef);
  let data = [
    blockNumber,
    eventIndex,
    event.section,
    event.method,
    phase.toString(),
    types,
    doc,
    JSON.stringify(event.data),
    timestamp,
  ];
  let sql = `INSERT INTO event (
    block_number,
    event_index,
    section,
    method,
    phase,
    types,
    doc,
    data,
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
    $9
  )
  ON CONFLICT ON CONSTRAINT event_pkey 
  DO NOTHING
  ;`;
  try {
    await client.query(sql, data);
    logger.debug(
      loggerOptions,
      `Added event #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`,
    );
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error adding event #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`,
    );
    Sentry.captureException(error);
  }

  // Store staking reward
  if (
    event.section === 'staking' &&
    (event.method === 'Reward' || event.method === 'Rewarded')
  ) {
    //
    // Store validator stash address and era index
    //

    let validator = null;
    let era = null;

    const payoutStakersExtrinsic = IndexedBlockExtrinsics.find(
      ([
        extrinsicIndex,
        {
          method: { section, method },
        },
      ]) =>
        phase.asApplyExtrinsic.eq(extrinsicIndex) && // event phase
        section === 'staking' &&
        method === 'payoutStakers',
    );

    if (payoutStakersExtrinsic) {
      validator = payoutStakersExtrinsic[1].method.args[0];
      era = payoutStakersExtrinsic[1].method.args[1];
    } else {
      // TODO: support era/validator extraction for staking.payoutValidator and staking.payoutNominator

      //
      // staking.payoutStakers extrinsic included in a utility.batch or utility.batchAll extrinsic
      //
      const utilityBatchExtrinsicIndexes = IndexedBlockExtrinsics.filter(
        ([extrinsicIndex, extrinsic]) =>
          phase.asApplyExtrinsic.eq(extrinsicIndex) && // event phase
          extrinsic.method.section === 'utility' &&
          (extrinsic.method.method === 'batch' ||
            extrinsic.method.method === 'batchAll'),
      ).map(([index]) => index);

      if (utilityBatchExtrinsicIndexes.length > 0) {
        // We know that utility.batch has some staking.payoutStakers extrinsic
        // Then we need to do a lookup of the previous staking.payoutStarted
        // event to get validator and era
        const payoutStartedEvents = IndexedBlockEvents.filter(
          ([, record]) =>
            record.phase.isApplyExtrinsic &&
            utilityBatchExtrinsicIndexes.includes(
              record.phase.asApplyExtrinsic.toNumber(),
            ) && // events should be related to utility.batch extrinsic
            record.event.section === 'staking' &&
            record.event.method === 'PayoutStarted',
        ).reverse();
        if (payoutStartedEvents) {
          const payoutStartedEvent = payoutStartedEvents.find(
            ([index]) => index < eventIndex,
          );
          if (payoutStartedEvent) {
            [era, validator] = payoutStartedEvent[1].event.data;
          }
        }
      } else {
        //
        // staking.payoutStakers extrinsic included in a proxy.proxy extrinsic
        //
        const proxyProxyExtrinsicIndexes = IndexedBlockExtrinsics.filter(
          ([extrinsicIndex, extrinsic]) =>
            phase.asApplyExtrinsic.eq(extrinsicIndex) && // event phase
            extrinsic.method.section === 'proxy' &&
            extrinsic.method.method === 'proxy',
        ).map(([index]) => index);

        if (proxyProxyExtrinsicIndexes.length > 0) {
          // We know that proxy.proxy has some staking.payoutStakers extrinsic
          // Then we need to do a lookup of the previous staking.payoutStarted
          // event to get validator and era
          const payoutStartedEvents = IndexedBlockEvents.filter(
            ([, record]) =>
              record.phase.isApplyExtrinsic &&
              proxyProxyExtrinsicIndexes.includes(
                record.phase.asApplyExtrinsic.toNumber(),
              ) && // events should be related to proxy.proxy extrinsic
              record.event.section === 'staking' &&
              record.event.method === 'PayoutStarted',
          ).reverse();
          if (payoutStartedEvents) {
            const payoutStartedEvent = payoutStartedEvents.find(
              ([index]) => index < eventIndex,
            );
            if (payoutStartedEvent) {
              [era, validator] = payoutStartedEvent[1].event.data;
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
        era.toString(),
        new BigNumber(event.data[1].toString()).toString(10),
        timestamp,
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
        timestamp,
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
      logger.debug(
        loggerOptions,
        `Added staking reward #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`,
      );
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding staking reward #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`,
      );
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
  if (
    event.section === 'staking' &&
    (event.method === 'Slash' || event.method === 'Slashed')
  ) {
    data = [
      blockNumber,
      eventIndex,
      event.data[0].toString(),
      event.data[0].toString(),
      activeEra - 1,
      new BigNumber(event.data[1].toString()).toString(10),
      timestamp,
    ];
    sql = `INSERT INTO staking_slash (
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
      logger.debug(
        loggerOptions,
        `Added validator staking slash #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`,
      );
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding validator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`,
      );
      Sentry.captureException(error);
    }
  }

  // Store nominator staking slash
  if (
    event.section === 'balances' &&
    (event.method === 'Slash' || event.method === 'Slashed')
  ) {
    const validatorStashAddress = getSlashedValidatorAccount(
      eventIndex,
      IndexedBlockEvents,
    );
    data = [
      blockNumber,
      eventIndex,
      event.data[0].toString(),
      validatorStashAddress,
      activeEra - 1,
      new BigNumber(event.data[1].toString()).toString(10),
      timestamp,
    ];
    sql = `INSERT INTO staking_slash (
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
      logger.debug(
        loggerOptions,
        `Added nominator staking slash #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`,
      );
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding nominator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`,
      );
      const scope = new Sentry.Scope();
      scope.setTag('blockNumber', blockNumber);
      Sentry.captureException(error, scope);
    }
  }
};

export const processEvents = async (
  client: Client,
  blockNumber: number,
  activeEra: number,
  blockEvents: EventRecord[],
  blockExtrinsics: Vec<GenericExtrinsic<AnyTuple>>,
  timestamp: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const startTime = new Date().getTime();
  const IndexedBlockEvents: IndexedBlockEvent[] = blockEvents.map(
    (event, index) => [index, event],
  );
  const IndexedBlockExtrinsics: IndexedBlockExtrinsic[] = blockExtrinsics.map(
    (extrinsic, index) => [index, extrinsic],
  );
  const chunks = chunker(IndexedBlockEvents, chunkSize);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((indexedEvent: IndexedBlockEvent) =>
        processEvent(
          client,
          blockNumber,
          activeEra,
          indexedEvent,
          IndexedBlockEvents,
          IndexedBlockExtrinsics,
          timestamp,
          loggerOptions,
        ),
      ),
    );
  }
  // Log execution time
  const endTime = new Date().getTime();
  logger.debug(
    loggerOptions,
    `Added ${blockEvents.length} events in ${(
      (endTime - startTime) /
      1000
    ).toFixed(3)}s`,
  );
};

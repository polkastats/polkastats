// @ts-check
import * as Sentry from '@sentry/node';
import { ApiPromise } from '@polkadot/api';
import { BlockHash, EventRecord } from '@polkadot/types/interfaces';
import { AnyTuple } from '@polkadot/types/types';
import { GenericExtrinsic, Vec } from '@polkadot/types';
import { ApiDecoration } from '@polkadot/api/types';
import { Client } from 'pg';
import { BigNumber } from 'bignumber.js';
import { chunker, shortHash } from './utils';
import { LoggerOptions, IndexedBlockExtrinsic } from './types';
import { backendConfig } from '../backend.config';
import { logger } from './logger';

Sentry.init({
  dsn: backendConfig.sentryDSN,
  tracesSampleRate: 1.0,
});

// Used for processing events and extrinsics
const chunkSize = 100;

export const getExtrinsicFeeInfo = async (api: ApiPromise, hexExtrinsic: string, blockHash: BlockHash, loggerOptions: LoggerOptions): Promise<string> => {
  try {
    const feeInfo = await api.rpc.payment.queryInfo(hexExtrinsic, blockHash);
    return JSON.stringify(feeInfo.toJSON());
  } catch (error) {
    logger.debug(loggerOptions, `Error getting extrinsic fee info: ${error}`);
  }
  return '';
};

export const getExtrinsicFeeDetails = async (api: ApiPromise, hexExtrinsic: string, blockHash: BlockHash, loggerOptions: LoggerOptions): Promise<string> => {
  try {
    const feeDetails = await api.rpc.payment.queryFeeDetails(hexExtrinsic, blockHash);
    return JSON.stringify(feeDetails.toJSON());
  } catch (error) {
    logger.debug(loggerOptions, `Error getting extrinsic fee details: ${error}`);
  }
  return '';
};

export const getExtrinsicSuccessOrErrorMessage = (
  apiAt: ApiDecoration<'promise'>,
  index: number,
  blockEvents: Vec<EventRecord>,
): [boolean, string] => {
  let extrinsicSuccess = false;
  let extrinsicErrorMessage = '';
  blockEvents
    .filter(
      ({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index),
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

export const getTransferAllAmount = (
  blockNumber: number,
  index: number,
  blockEvents: Vec<EventRecord>,
): string => {
  try {
    return blockEvents
      .find(
        ({ event, phase }) =>
          phase.isApplyExtrinsic &&
          phase.asApplyExtrinsic.eq(index) &&
          event.section === 'balances' &&
          event.method === 'Transfer',
      )
      .event.data[2].toString();
  } catch (error) {
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
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
  signer: string,
  feeInfo: string,
  success: boolean,
  errorMessage: string,
  timestamp: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  // Store transfer
  const source = signer;
  let destination = '';

  if (JSON.parse(args)[0].id) {
    destination = JSON.parse(args)[0].id;
  } else if (JSON.parse(args)[0].address20) {
    destination = JSON.parse(args)[0].address20;
  } else {
    destination = JSON.parse(args)[0];
  }

  let amount;
  if (method === 'transferAll' && success) {
    // Equal source and destination addres doesn't trigger a balances.Transfer event
    amount =
      source === destination
        ? 0
        : getTransferAllAmount(blockNumber, extrinsicIndex, blockEvents);
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
    timestamp,
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
    logger.debug(
      loggerOptions,
      `Added transfer ${blockNumber}-${extrinsicIndex} (${shortHash(
        hash.toString(),
      )}) ${section} ➡ ${method}`,
    );
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error adding transfer ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(
        error,
      )}`,
    );
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }
};

export const processExtrinsic = async (
  api: ApiPromise,
  apiAt: ApiDecoration<'promise'>,
  client: Client,
  blockNumber: number,
  blockHash: BlockHash,
  indexedExtrinsic: IndexedBlockExtrinsic,
  blockEvents: Vec<EventRecord>,
  timestamp: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const [extrinsicIndex, extrinsic] = indexedExtrinsic;
  const { isSigned } = extrinsic;
  const signer = isSigned ? extrinsic.signer.toString() : '';
  const section = extrinsic.method.section;
  const method = extrinsic.method.method;
  const args = JSON.stringify(extrinsic.method.args);
  const argsDef = JSON.stringify(extrinsic.argsDef);
  const hash = extrinsic.hash.toHex();
  const doc = JSON.stringify(extrinsic.meta.docs.toJSON());
  // See: https://polkadot.js.org/docs/api/cookbook/blocks/#how-do-i-determine-if-an-extrinsic-succeededfailed
  const [success, errorMessage] = getExtrinsicSuccessOrErrorMessage(
    apiAt,
    extrinsicIndex,
    blockEvents,
  );
  let feeInfo = '';
  let feeDetails = '';
  if (isSigned) {
    feeInfo = await getExtrinsicFeeInfo(api, extrinsic.toHex(), blockHash, loggerOptions);
    feeDetails = await getExtrinsicFeeDetails(api, extrinsic.toHex(), blockHash, loggerOptions);
  }
  let data = [
    blockNumber,
    extrinsicIndex,
    isSigned,
    signer,
    section,
    method,
    args,
    argsDef,
    hash,
    doc,
    feeInfo,
    feeDetails,
    success,
    errorMessage,
    timestamp,
  ];
  let sql = `INSERT INTO extrinsic (
      block_number,
      extrinsic_index,
      is_signed,
      signer,
      section,
      method,
      args,
      args_def,
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
      $14,
      $15
    )
    ON CONFLICT ON CONSTRAINT extrinsic_pkey 
    DO NOTHING;
    ;`;
  try {
    await client.query(sql, data);
    logger.debug(
      loggerOptions,
      `Added extrinsic ${blockNumber}-${extrinsicIndex} (${shortHash(
        hash,
      )}) ${section} ➡ ${method}`,
    );
  } catch (error) {
    logger.error(
      loggerOptions,
      `Error adding extrinsic ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(
        error,
      )}`,
    );
    const scope = new Sentry.Scope();
    scope.setTag('blockNumber', blockNumber);
    Sentry.captureException(error, scope);
  }

  if (isSigned) {
    data = [
      blockNumber,
      extrinsicIndex,
      signer,
      section,
      method,
      args,
      argsDef,
      hash,
      doc,
      feeInfo,
      feeDetails,
      success,
      errorMessage,
      timestamp,
    ];
    // Store signed extrinsic
    sql = `INSERT INTO signed_extrinsic (
      block_number,
      extrinsic_index,
      signer,
      section,
      method,
      args,
      args_def,
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
    ON CONFLICT ON CONSTRAINT signed_extrinsic_pkey 
    DO NOTHING;
    ;`;
    try {
      await client.query(sql, data);
      logger.debug(
        loggerOptions,
        `Added signed extrinsic ${blockNumber}-${extrinsicIndex} (${shortHash(
          hash,
        )}) ${section} ➡ ${method}`,
      );
    } catch (error) {
      logger.error(
        loggerOptions,
        `Error adding signed extrinsic ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(
          error,
        )}`,
      );
      Sentry.captureException(error);
    }
    if (
      section === 'balances' &&
      (method === 'forceTransfer' ||
        method === 'transfer' ||
        method === 'transferAll' ||
        method === 'transferKeepAlive')
    ) {
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
        loggerOptions,
      );
    }
  }
};

export const processExtrinsics = async (
  api: ApiPromise,
  apiAt: ApiDecoration<'promise'>,
  client: Client,
  blockNumber: number,
  blockHash: BlockHash,
  extrinsics: Vec<GenericExtrinsic<AnyTuple>>,
  blockEvents: Vec<EventRecord>,
  timestamp: number,
  loggerOptions: LoggerOptions,
): Promise<void> => {
  const startTime = new Date().getTime();
  const indexedExtrinsics: IndexedBlockExtrinsic[] = extrinsics.map(
    (extrinsic, index) => [index, extrinsic],
  );
  const chunks = chunker(indexedExtrinsics, chunkSize);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((indexedExtrinsic: IndexedBlockExtrinsic) =>
        processExtrinsic(
          api,
          apiAt,
          client,
          blockNumber,
          blockHash,
          indexedExtrinsic,
          blockEvents,
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
    `Added ${extrinsics.length} extrinsics in ${(
      (endTime - startTime) /
      1000
    ).toFixed(3)}s`,
  );
};

// @ts-check
const pino = require('pino');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');
const { Pool } = require('pg');
const _ = require('lodash');
const config = require('../backend.config');

const logger = pino();

module.exports = {
  getPolkadotAPI: async (loggerOptions) => {
    logger.debug(loggerOptions, `Connecting to ${config.wsProviderUrl}`);
    const provider = new WsProvider(config.wsProviderUrl);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    return api;
  },
  getPool: (loggerOptions) => {
    logger.debug(loggerOptions, `Connecting to DB ${config.postgresConnParams.database} at ${config.postgresConnParams.host}:${config.postgresConnParams.port}`);
    return new Pool(config.postgresConnParams);
  },
  isNodeSynced: async (api, loggerOptions) => {
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
  },
  formatNumber: (number) => (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'),
  shortHash: (hash) => `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`,
  wait: async (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }),
  dbQuery: async (pool, sql) => {
    const client = await pool.connect();
    try {
      return await client.query(sql);
    } finally {
      client.release();
    }
  },
  dbParamQuery: async (pool, sql, data) => {
    const client = await pool.connect();
    try {
      return await client.query(sql, data);
    } finally {
      client.release();
    }
  },
  isValidAddressPolkadotAddress: (address) => {
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
  },
  updateAccountsInfo: async (api, pool, blockNumber, timestamp, loggerOptions, blockEvents) => {
    const startTime = new Date().getTime();
    const involvedAddresses = [];
    blockEvents
      .forEach(({ event }) => {
        event.data.forEach((arg) => {
          if (module.exports.isValidAddressPolkadotAddress(arg)) {
            involvedAddresses.push(arg);
          }
        });
      });
    const uniqueAddresses = _.uniq(involvedAddresses);
    await Promise.all(
      uniqueAddresses.map(
        (address) => module.exports.updateAccountInfo(
          api, pool, blockNumber, timestamp, address, loggerOptions,
        ),
      ),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Updated ${uniqueAddresses.length} accounts in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  updateAccountInfo: async (api, pool, blockNumber, timestamp, address, loggerOptions) => {
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
    const sql = `
      INSERT INTO   account (account_id, identity, identity_display, identity_display_parent, balances, available_balance, free_balance, locked_balance, nonce, timestamp, block_height)
      VALUES        ('${address}', '${JSONIdentity}', '${identityDisplay}', '${identityDisplayParent}', '${JSONbalances}', '${availableBalance}', '${freeBalance}', '${lockedBalance}', '${nonce}', '${timestamp}', '${blockNumber}')
      ON CONFLICT   (account_id)
      DO UPDATE
      SET           identity = EXCLUDED.identity,
                    identity_display = EXCLUDED.identity_display,
                    identity_display_parent = EXCLUDED.identity_display_parent,
                    balances = EXCLUDED.balances,
                    available_balance = EXCLUDED.available_balance,
                    free_balance = EXCLUDED.free_balance,
                    locked_balance = EXCLUDED.locked_balance,
                    nonce = EXCLUDED.nonce,
                    timestamp = EXCLUDED.timestamp,
                    block_height = EXCLUDED.block_height;
    `;
    try {
      // eslint-disable-next-line no-await-in-loop
      await module.exports.dbQuery(pool, sql);
      logger.debug(loggerOptions, `Updated account info for event/s involved address ${address}`);
    } catch (error) {
      logger.error(loggerOptions, `Error updating account info for event/s involved address: ${JSON.stringify(error)}`);
    }
  },
  storeExtrinsics: async (
    api,
    pool,
    blockNumber,
    blockHash,
    extrinsics,
    blockEvents,
    timestamp,
    loggerOptions,
  ) => {
    const startTime = new Date().getTime();
    await Promise.all(
      extrinsics.map((extrinsic, index) => module.exports.storeExtrinsic(
        api,
        pool,
        blockNumber,
        blockHash,
        extrinsic,
        index,
        blockEvents,
        timestamp,
        loggerOptions,
      )),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  storeExtrinsic: async (
    api,
    pool,
    blockNumber,
    blockHash,
    extrinsic,
    index,
    blockEvents,
    timestamp,
    loggerOptions,
  ) => {
    const { isSigned } = extrinsic;
    const signer = isSigned ? extrinsic.signer.toString() : '';
    const { section } = extrinsic.toHuman().method;
    const { method } = extrinsic.toHuman().method;
    const args = JSON.stringify(extrinsic.args);
    const hash = extrinsic.hash.toHex();
    const doc = extrinsic.meta.documentation.toString().replace(/'/g, "''");
    const success = module.exports.getExtrinsicSuccess(index, blockEvents);

    // Fees
    let feeInfo = '';
    let feeDetails = '';
    if (isSigned) {
      [feeInfo, feeDetails] = await Promise.all([
        api.rpc.payment.queryInfo(
          extrinsic.toHex(), blockHash,
        ).then((result) => JSON.stringify(result.toJSON())),
        api.rpc.payment.queryFeeDetails(
          extrinsic.toHex(), blockHash,
        ).then((result) => JSON.stringify(result.toJSON())),
      ]);
    }

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
        '${timestamp}'
      )
      ON CONFLICT ON CONSTRAINT extrinsic_pkey 
      DO NOTHING;
      ;`;
    try {
      await module.exports.dbQuery(pool, sql);
      logger.debug(loggerOptions, `Added extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
    }
  },
  storeEvents: async (
    pool, blockNumber, blockEvents, timestamp, loggerOptions,
  ) => {
    const startTime = new Date().getTime();
    await Promise.all(
      blockEvents.map((record, index) => module.exports.storeEvent(
        pool, blockNumber, record, index, timestamp, loggerOptions,
      )),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  storeEvent: async (
    pool, blockNumber, record, index, timestamp, loggerOptions,
  ) => {
    const { event, phase } = record;
    const sql = `INSERT INTO event (
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
      // eslint-disable-next-line no-await-in-loop
      await module.exports.dbQuery(pool, sql);
      logger.debug(loggerOptions, `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding event #${blockNumber}-${index}: ${error}, sql: ${sql}`);
    }
  },
  storeLogs: async (pool, blockNumber, logs, timestamp, loggerOptions) => {
    const startTime = new Date().getTime();
    await Promise.all(
      logs.map((log, index) => module.exports.storeLog(
        pool, blockNumber, log, index, timestamp, loggerOptions,
      )),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  storeLog: async (pool, blockNumber, log, index, timestamp, loggerOptions) => {
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
      await module.exports.dbQuery(pool, sql);
      logger.debug(loggerOptions, `Added log ${blockNumber}-${index}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`);
    }
  },
  getExtrinsicSuccess: (index, blockEvents) => {
    // assume success if no events were extracted
    if (blockEvents.length === 0) {
      return true;
    }
    let extrinsicSuccess = false;
    blockEvents.forEach((record) => {
      const { event, phase } = record;
      if (
        parseInt(phase.toHuman().ApplyExtrinsic, 10) === index
        && event.section === 'system'
        && event.method === 'ExtrinsicSuccess'
      ) {
        extrinsicSuccess = true;
      }
    });
    return extrinsicSuccess;
  },
  getDisplayName: (identity) => {
    if (
      identity.displayParent
      && identity.displayParent !== ''
      && identity.display
      && identity.display !== ''
    ) {
      return `${identity.displayParent} / ${identity.display}`;
    }
    return identity.display || '';
  },
  updateTotals: async (pool, loggerOptions) => {
    await Promise.all([
      module.exports.updateTotalBlocks(pool, loggerOptions),
      module.exports.updateTotalExtrinsics(pool, loggerOptions),
      module.exports.updateTotalTransfers(pool, loggerOptions),
      module.exports.updateTotalEvents(pool, loggerOptions),
    ]);
  },
  updateTotalBlocks: async (pool, loggerOptions) => {
    const sql = `
      UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks';
    `;
    try {
      await module.exports.dbQuery(pool, sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating totals: ${error}`);
    }
  },
  updateTotalExtrinsics: async (pool, loggerOptions) => {
    const sql = `
      UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';
    `;
    try {
      await module.exports.dbQuery(pool, sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating total extrinsics: ${error}`);
    }
  },
  updateTotalTransfers: async (pool, loggerOptions) => {
    const sql = `
      UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer' ) WHERE name = 'transfers';
    `;
    try {
      await module.exports.dbQuery(pool, sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating totals transfers ${error}`);
    }
  },
  updateTotalEvents: async (pool, loggerOptions) => {
    const sql = `
      UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events';
    `;
    try {
      await module.exports.dbQuery(pool, sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating total events: ${error}`);
    }
  },
  updateFinalized: async (pool, finalizedBlock, loggerOptions) => {
    const sql = `
      UPDATE block SET finalized = true WHERE finalized = false AND block_number <= ${finalizedBlock};
    `;
    try {
      await module.exports.dbQuery(pool, sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
    }
  },
};

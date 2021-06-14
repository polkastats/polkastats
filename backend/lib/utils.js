// @ts-check
const pino = require('pino');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');
const { Client } = require('pg');
const _ = require('lodash');
const config = require('../backend.config.js');

const logger = pino();

module.exports = {
  getPolkadotAPI: async (loggerOptions) => {
    logger.info(loggerOptions, `Connecting to ${config.wsProviderUrl}`);
    const provider = new WsProvider(config.wsProviderUrl);
    const api = await ApiPromise.create({ provider });
    await api.isReady;
    return api;
  },
  getClient: async (loggerOptions) => {
    logger.info(loggerOptions, `Connecting to DB ${config.postgresConnParams.database} at ${config.postgresConnParams.host}:${config.postgresConnParams.port}`);
    const client = new Client(config.postgresConnParams);
    await client.connect();
    return client;
  },
  isNodeSynced: async (api, loggerOptions) => {
    let node;
    try {
      node = await api.rpc.system.health();
    } catch {
      logger.error(loggerOptions, "Can't query node status");
    }
    if (node && node.isSyncing.eq(false)) {
      logger.error(loggerOptions, 'Node is synced!');
      return true;
    }
    logger.error(loggerOptions, 'Node is NOT synced!');
    return false;
  },
  formatNumber: (number) => (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'),
  shortHash: (hash) => `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`,
  wait: async (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }),
  dbQuery: async (client, sql, loggerOptions) => {
    try {
      return await client.query(sql);
    } catch (error) {
      logger.error(loggerOptions, `SQL: ${sql} ERROR: ${JSON.stringify(error)}`);
    }
    return null;
  },
  dbParamInsert: async (client, sql, data, loggerOptions) => {
    try {
      await client.query(sql, data);
    } catch (error) {
      logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
    }
  },
  dbParamSelect: async (client, sql, data, loggerOptions) => {
    try {
      return await client.query(sql, data);
    } catch (error) {
      logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
    }
    return null;
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
  updateAccountsInfo: async (api, client, blockNumber, timestamp, loggerOptions, blockEvents) => {
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
          api, client, blockNumber, timestamp, address, loggerOptions,
        ),
      ),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Updated ${uniqueAddresses.length} accounts in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  updateAccountInfo: async (api, client, blockNumber, timestamp, address, loggerOptions) => {
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
      await client.query(sql);
      logger.error(loggerOptions, `Updated account info for event/s involved address ${address}`);
    } catch (error) {
      logger.error(loggerOptions, `Error updating account info for event/s involved address: ${JSON.stringify(error)}`);
    }
  },
  storeExtrinsics: async (
    client, blockNumber, extrinsics, blockEvents, timestamp, loggerOptions,
  ) => {
    const startTime = new Date().getTime();
    await Promise.all(
      extrinsics.map((extrinsic, index) => module.exports.storeExtrinsic(
        client, blockNumber, extrinsic, index, blockEvents, timestamp, loggerOptions,
      )),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  storeExtrinsic: async (
    client, blockNumber, extrinsic, index, blockEvents, timestamp, loggerOptions,
  ) => {
    const { isSigned } = extrinsic;
    const signer = isSigned ? extrinsic.signer.toString() : '';
    const { section } = extrinsic.toHuman().method;
    const { method } = extrinsic.toHuman().method;
    const args = JSON.stringify(extrinsic.args);
    const hash = extrinsic.hash.toHex();
    const doc = extrinsic.meta.documentation.toString().replace(/'/g, "''");
    const success = module.exports.getExtrinsicSuccess(index, blockEvents);
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
        '${success}',
        '${timestamp}'
      )
      ON CONFLICT ON CONSTRAINT extrinsic_pkey 
      DO NOTHING;
      ;`;
    try {
      await client.query(sql);
      logger.info(loggerOptions, `Added extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
    }
  },
  storeEvents: async (
    client, blockNumber, blockEvents, timestamp, loggerOptions,
  ) => {
    const startTime = new Date().getTime();
    await Promise.all(
      blockEvents.map((record, index) => module.exports.storeEvent(
        client, blockNumber, record, index, timestamp, loggerOptions,
      )),
    );
    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  storeEvent: async (
    client, blockNumber, record, index, timestamp, loggerOptions,
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
      await client.query(sql);
      logger.info(loggerOptions, `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
    } catch (error) {
      logger.error(loggerOptions, `Error adding event #${blockNumber}-${index}: ${error}, sql: ${sql}`);
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
  updateTotals: async (client, loggerOptions) => {
    const sql = `
        UPDATE total SET count = (SELECT count(block_number) FROM block) WHERE name = 'blocks';
        UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';
        UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer' ) WHERE name = 'transfers';
        UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events';
      `;
    try {
      await client.query(sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating totals: ${error}`);
    }
  },
  updateFinalized: async (client, finalizedBlock, loggerOptions) => {
    const sql = `
      UPDATE block SET finalized = true WHERE finalized = false AND block_number <= ${finalizedBlock};
    `;
    try {
      await client.query(sql);
    } catch (error) {
      logger.error(loggerOptions, `Error updating totals: ${error}`);
    }
  },
};

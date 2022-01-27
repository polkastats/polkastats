var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-check
require('@polkadot/api-augment');
const pino = require('pino');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');
const { Client } = require('pg');
const _ = require('lodash');
const fs = require('fs');
const config = require('../backend.config');
const logger = pino();
module.exports = {
    getPolkadotAPI: (loggerOptions, apiCustomTypes) => __awaiter(this, void 0, void 0, function* () {
        let api;
        logger.debug(loggerOptions, `Connecting to ${config.wsProviderUrl}`);
        const provider = new WsProvider(config.wsProviderUrl);
        if (apiCustomTypes && apiCustomTypes !== '') {
            const types = JSON.parse(fs.readFileSync(`./types/${apiCustomTypes}`, 'utf8'));
            api = yield ApiPromise.create({ provider, types });
        }
        else {
            api = yield ApiPromise.create({ provider });
        }
        yield api.isReady;
        return api;
    }),
    isNodeSynced: (api, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        let node;
        try {
            node = yield api.rpc.system.health();
        }
        catch (_a) {
            logger.error(loggerOptions, "Can't query node status");
        }
        if (node && node.isSyncing.eq(false)) {
            logger.debug(loggerOptions, 'Node is synced!');
            return true;
        }
        logger.debug(loggerOptions, 'Node is NOT synced!');
        return false;
    }),
    formatNumber: (number) => (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'),
    shortHash: (hash) => `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`,
    wait: (ms) => __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }),
    getClient: (loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        logger.debug(loggerOptions, `Connecting to DB ${config.postgresConnParams.database} at ${config.postgresConnParams.host}:${config.postgresConnParams.port}`);
        const client = new Client(config.postgresConnParams);
        yield client.connect();
        return client;
    }),
    dbQuery: (client, sql, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        try {
            return yield client.query(sql);
        }
        catch (error) {
            logger.error(loggerOptions, `SQL: ${sql} ERROR: ${JSON.stringify(error)}`);
        }
        return null;
    }),
    dbParamQuery: (client, sql, data, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        try {
            return yield client.query(sql, data);
        }
        catch (error) {
            logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
        }
        return null;
    }),
    isValidAddressPolkadotAddress: (address) => {
        try {
            encodeAddress(isHex(address)
                ? hexToU8a(address.toString())
                : decodeAddress(address));
            return true;
        }
        catch (error) {
            return false;
        }
    },
    updateAccountsInfo: (api, client, blockNumber, timestamp, loggerOptions, blockEvents) => __awaiter(this, void 0, void 0, function* () {
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
        yield Promise.all(uniqueAddresses.map((address) => module.exports.updateAccountInfo(api, client, blockNumber, timestamp, address, loggerOptions)));
        // Log execution time
        const endTime = new Date().getTime();
        logger.debug(loggerOptions, `Updated ${uniqueAddresses.length} accounts in ${((endTime - startTime) / 1000).toFixed(3)}s`);
    }),
    updateAccountInfo: (api, client, blockNumber, timestamp, address, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const [balances, { identity }] = yield Promise.all([
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
            // eslint-disable-next-line no-await-in-loop
            yield client.query(query, data);
            logger.debug(loggerOptions, `Updated account info for event/s involved address ${address}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error updating account info for event/s involved address: ${JSON.stringify(error)}`);
        }
    }),
    processExtrinsics: (api, client, blockNumber, blockHash, extrinsics, blockEvents, timestamp, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const startTime = new Date().getTime();
        yield Promise.all(extrinsics.map((extrinsic, index) => module.exports.processExtrinsic(api, client, blockNumber, blockHash, extrinsic, index, blockEvents, timestamp, loggerOptions)));
        // Log execution time
        const endTime = new Date().getTime();
        logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
    }),
    processExtrinsic: (api, client, blockNumber, blockHash, extrinsic, index, blockEvents, timestamp, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const { isSigned } = extrinsic;
        const signer = isSigned ? extrinsic.signer.toString() : '';
        const { section } = extrinsic.toHuman().method;
        const { method } = extrinsic.toHuman().method;
        const args = JSON.stringify(extrinsic.args);
        const hash = extrinsic.hash.toHex();
        const doc = extrinsic.meta.docs.toString().replace(/'/g, "''");
        const success = module.exports.getExtrinsicSuccess(index, blockEvents);
        // Fees
        // TODO: Investigate why this queries fail
        //
        // This throws an error at certain blocks
        //
        // const blockNumber = 5935949;
        // const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
        // const { block } = await api.rpc.chain.getBlock(blockHash);
        // for (const extrinsic of block.extrinsics) {
        //   if (extrinsic.isSigned) {
        //     const queryFeeDetails= await api.rpc.payment.queryFeeDetails(
        //       extrinsic.toHex(),
        //       blockHash
        //     ).catch(error => console.log(error)) || '';
        //     const queryInfo = await api.rpc.payment.queryInfo(
        //       extrinsic.toHex(),
        //       blockHash
        //     ).catch(error => console.log(error)) || '';
        //     console.log(JSON.stringify(queryFeeDetails));
        //     console.log(JSON.stringify(queryInfo));
        //   }
        // }
        // let feeInfo = '';
        // let feeDetails = '';
        // if (isSigned) {
        //   feeInfo = await api.rpc.payment.queryInfo(extrinsic.toHex(), blockHash)
        //     .then((result) => JSON.stringify(result.toJSON()))
        //     .catch(() => {}) || '';
        //   feeDetails = await api.rpc.payment.queryFeeDetails(extrinsic.toHex(), blockHash)
        //     .then((result) => JSON.stringify(result.toJSON()))
        //     .catch(() => {}) || '';
        // }
        let feeInfo = '';
        let feeDetails = '';
        if (isSigned) {
            [feeInfo, feeDetails] = yield Promise.all([
                api.rpc.payment.queryInfo(extrinsic.toHex(), blockHash)
                    .then((result) => JSON.stringify(result.toJSON()))
                    .catch((error) => logger.debug(loggerOptions, `API Error: ${error}`)) || '',
                api.rpc.payment.queryFeeDetails(extrinsic.toHex(), blockHash)
                    .then((result) => JSON.stringify(result.toJSON()))
                    .catch((error) => logger.debug(loggerOptions, `API Error: ${error}`)) || '',
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
            yield client.query(sql);
            logger.debug(loggerOptions, `Added extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
        }
    }),
    processEvents: (client, blockNumber, blockEvents, timestamp, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const startTime = new Date().getTime();
        yield Promise.all(blockEvents.map((record, index) => module.exports.processEvent(client, blockNumber, record, index, timestamp, loggerOptions)));
        // Log execution time
        const endTime = new Date().getTime();
        logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
    }),
    processEvent: (client, blockNumber, record, index, timestamp, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
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
            yield client.query(sql);
            logger.debug(loggerOptions, `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding event #${blockNumber}-${index}: ${error}, sql: ${sql}`);
        }
    }),
    processLogs: (client, blockNumber, logs, timestamp, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const startTime = new Date().getTime();
        yield Promise.all(logs.map((log, index) => module.exports.processLog(client, blockNumber, log, index, timestamp, loggerOptions)));
        // Log execution time
        const endTime = new Date().getTime();
        logger.debug(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
    }),
    processLog: (client, blockNumber, log, index, timestamp, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
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
            yield client.query(sql);
            logger.debug(loggerOptions, `Added log ${blockNumber}-${index}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`);
        }
    }),
    getExtrinsicSuccess: (index, blockEvents) => {
        // assume success if no events were extracted
        if (blockEvents.length === 0) {
            return true;
        }
        let extrinsicSuccess = false;
        blockEvents.forEach((record) => {
            const { event, phase } = record;
            if (parseInt(phase.toHuman().ApplyExtrinsic, 10) === index
                && event.section === 'system'
                && event.method === 'ExtrinsicSuccess') {
                extrinsicSuccess = true;
            }
        });
        return extrinsicSuccess;
    },
    getDisplayName: (identity) => {
        if (identity.displayParent
            && identity.displayParent !== ''
            && identity.display
            && identity.display !== '') {
            return `${identity.displayParent} / ${identity.display}`;
        }
        return identity.display || '';
    },
    // TODO: Investigate https://dzone.com/articles/faster-postgresql-counting
    updateTotals: (client, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        yield Promise.all([
            module.exports.updateTotalBlocks(client, loggerOptions),
            module.exports.updateTotalExtrinsics(client, loggerOptions),
            module.exports.updateTotalTransfers(client, loggerOptions),
            module.exports.updateTotalEvents(client, loggerOptions),
        ]);
    }),
    updateTotalBlocks: (client, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const sql = `
      UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks';
    `;
        try {
            yield client.query(sql);
        }
        catch (error) {
            logger.error(loggerOptions, `Error updating totals: ${error}`);
        }
    }),
    updateTotalExtrinsics: (client, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const sql = `
      UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';
    `;
        try {
            yield client.query(sql);
        }
        catch (error) {
            logger.error(loggerOptions, `Error updating total extrinsics: ${error}`);
        }
    }),
    updateTotalTransfers: (client, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const sql = `
      UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer' ) WHERE name = 'transfers';
    `;
        try {
            yield client.query(sql);
        }
        catch (error) {
            logger.error(loggerOptions, `Error updating totals transfers ${error}`);
        }
    }),
    updateTotalEvents: (client, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const sql = `
      UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events';
    `;
        try {
            yield client.query(sql);
        }
        catch (error) {
            logger.error(loggerOptions, `Error updating total events: ${error}`);
        }
    }),
    updateFinalized: (client, finalizedBlock, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
        const sql = `
      UPDATE block SET finalized = true WHERE finalized = false AND block_number <= ${finalizedBlock};
    `;
        try {
            yield client.query(sql);
        }
        catch (error) {
            logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
        }
    }),
    logHarvestError: (client, blockNumber, error, loggerOptions) => __awaiter(this, void 0, void 0, function* () {
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
        yield module.exports.dbParamQuery(client, query, data, loggerOptions);
    }),
};

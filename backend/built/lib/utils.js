"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logHarvestError = exports.updateFinalized = exports.updateTotalEvents = exports.updateTotalTransfers = exports.updateTotalExtrinsics = exports.updateTotalBlocks = exports.updateTotals = exports.getDisplayName = exports.getExtrinsicSuccess = exports.processLog = exports.processLogs = exports.processEvent = exports.processEvents = exports.processExtrinsic = exports.processExtrinsics = exports.updateAccountInfo = exports.updateAccountsInfo = exports.isValidAddressPolkadotAddress = exports.dbParamQuery = exports.dbQuery = exports.getClient = exports.wait = exports.shortHash = exports.formatNumber = exports.isNodeSynced = exports.getPolkadotAPI = void 0;
// @ts-check
require('@polkadot/api-augment');
const pino_1 = __importDefault(require("pino"));
const api_1 = require("@polkadot/api");
const keyring_1 = require("@polkadot/keyring");
const util_1 = require("@polkadot/util");
const pg_1 = require("pg");
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const backend_config_1 = require("../backend.config");
const logger = (0, pino_1.default)();
const getPolkadotAPI = (loggerOptions, apiCustomTypes) => __awaiter(void 0, void 0, void 0, function* () {
    let api;
    logger.debug(loggerOptions, `Connecting to ${backend_config_1.backendConfig.wsProviderUrl}`);
    const provider = new api_1.WsProvider(backend_config_1.backendConfig.wsProviderUrl);
    if (apiCustomTypes && apiCustomTypes !== '') {
        const types = JSON.parse(fs_1.default.readFileSync(`./types/${apiCustomTypes}`, 'utf8'));
        api = yield api_1.ApiPromise.create({ provider, types });
    }
    else {
        api = yield api_1.ApiPromise.create({ provider });
    }
    yield api.isReady;
    return api;
});
exports.getPolkadotAPI = getPolkadotAPI;
const isNodeSynced = (api, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.isNodeSynced = isNodeSynced;
const formatNumber = (number) => (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
exports.formatNumber = formatNumber;
const shortHash = (hash) => `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;
exports.shortHash = shortHash;
const wait = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
});
exports.wait = wait;
const getClient = (loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    logger.debug(loggerOptions, `Connecting to DB ${backend_config_1.backendConfig.postgresConnParams.database} at ${backend_config_1.backendConfig.postgresConnParams.host}:${backend_config_1.backendConfig.postgresConnParams.port}`);
    const client = new pg_1.Client(backend_config_1.backendConfig.postgresConnParams);
    yield client.connect();
    return client;
});
exports.getClient = getClient;
const dbQuery = (client, sql, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield client.query(sql);
    }
    catch (error) {
        logger.error(loggerOptions, `SQL: ${sql} ERROR: ${JSON.stringify(error)}`);
    }
    return null;
});
exports.dbQuery = dbQuery;
const dbParamQuery = (client, sql, data, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield client.query(sql, data);
    }
    catch (error) {
        logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
    }
    return null;
});
exports.dbParamQuery = dbParamQuery;
const isValidAddressPolkadotAddress = (address) => {
    try {
        (0, keyring_1.encodeAddress)((0, util_1.isHex)(address)
            ? (0, util_1.hexToU8a)(address.toString())
            : (0, keyring_1.decodeAddress)(address));
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.isValidAddressPolkadotAddress = isValidAddressPolkadotAddress;
const updateAccountsInfo = (api, client, blockNumber, timestamp, loggerOptions, blockEvents) => __awaiter(void 0, void 0, void 0, function* () {
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
    const uniqueAddresses = lodash_1.default.uniq(involvedAddresses);
    yield Promise.all(uniqueAddresses.map((address) => module.exports.updateAccountInfo(api, client, blockNumber, timestamp, address, loggerOptions)));
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Updated ${uniqueAddresses.length} accounts in ${((endTime - startTime) / 1000).toFixed(3)}s`);
});
exports.updateAccountsInfo = updateAccountsInfo;
const updateAccountInfo = (api, client, blockNumber, timestamp, address, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.updateAccountInfo = updateAccountInfo;
const processExtrinsics = (api, client, blockNumber, blockHash, extrinsics, blockEvents, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    yield Promise.all(extrinsics.map((extrinsic, index) => module.exports.processExtrinsic(api, client, blockNumber, blockHash, extrinsic, index, blockEvents, timestamp, loggerOptions)));
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
});
exports.processExtrinsics = processExtrinsics;
const processExtrinsic = (api, client, blockNumber, blockHash, extrinsic, index, blockEvents, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.processExtrinsic = processExtrinsic;
const processEvents = (client, blockNumber, blockEvents, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    yield Promise.all(blockEvents.map((record, index) => module.exports.processEvent(client, blockNumber, record, index, timestamp, loggerOptions)));
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
});
exports.processEvents = processEvents;
const processEvent = (client, blockNumber, record, index, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.processEvent = processEvent;
const processLogs = (client, blockNumber, logs, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    yield Promise.all(logs.map((log, index) => module.exports.processLog(client, blockNumber, log, index, timestamp, loggerOptions)));
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
});
exports.processLogs = processLogs;
const processLog = (client, blockNumber, log, index, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.processLog = processLog;
const getExtrinsicSuccess = (index, blockEvents) => {
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
};
exports.getExtrinsicSuccess = getExtrinsicSuccess;
const getDisplayName = (identity) => {
    if (identity.displayParent
        && identity.displayParent !== ''
        && identity.display
        && identity.display !== '') {
        return `${identity.displayParent} / ${identity.display}`;
    }
    return identity.display || '';
};
exports.getDisplayName = getDisplayName;
// TODO: Investigate https://dzone.com/articles/faster-postgresql-counting
const updateTotals = (client, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        module.exports.updateTotalBlocks(client, loggerOptions),
        module.exports.updateTotalExtrinsics(client, loggerOptions),
        module.exports.updateTotalTransfers(client, loggerOptions),
        module.exports.updateTotalEvents(client, loggerOptions),
    ]);
});
exports.updateTotals = updateTotals;
const updateTotalBlocks = (client, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const sql = `
    UPDATE total SET count = (SELECT count(*) FROM block) WHERE name = 'blocks';
  `;
    try {
        yield client.query(sql);
    }
    catch (error) {
        logger.error(loggerOptions, `Error updating totals: ${error}`);
    }
});
exports.updateTotalBlocks = updateTotalBlocks;
const updateTotalExtrinsics = (client, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const sql = `
    UPDATE total SET count = (SELECT count(*) FROM extrinsic) WHERE name = 'extrinsics';
  `;
    try {
        yield client.query(sql);
    }
    catch (error) {
        logger.error(loggerOptions, `Error updating total extrinsics: ${error}`);
    }
});
exports.updateTotalExtrinsics = updateTotalExtrinsics;
const updateTotalTransfers = (client, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const sql = `
    UPDATE total SET count = (SELECT count(*) FROM extrinsic WHERE section = 'balances' and method = 'transfer' ) WHERE name = 'transfers';
  `;
    try {
        yield client.query(sql);
    }
    catch (error) {
        logger.error(loggerOptions, `Error updating totals transfers ${error}`);
    }
});
exports.updateTotalTransfers = updateTotalTransfers;
const updateTotalEvents = (client, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const sql = `
    UPDATE total SET count = (SELECT count(*) FROM event) WHERE name = 'events';
  `;
    try {
        yield client.query(sql);
    }
    catch (error) {
        logger.error(loggerOptions, `Error updating total events: ${error}`);
    }
});
exports.updateTotalEvents = updateTotalEvents;
const updateFinalized = (client, finalizedBlock, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const sql = `
    UPDATE block SET finalized = true WHERE finalized = false AND block_number <= ${finalizedBlock};
  `;
    try {
        yield client.query(sql);
    }
    catch (error) {
        logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
    }
});
exports.updateFinalized = updateFinalized;
const logHarvestError = (client, blockNumber, error, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.logHarvestError = logHarvestError;

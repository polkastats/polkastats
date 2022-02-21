"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.harvestBlocks = exports.harvestBlocksSeq = exports.harvestBlock = exports.healthCheck = exports.getSlashedValidatorAccount = exports.getTransferAllAmount = exports.range = exports.reverseRange = exports.chunker = exports.logHarvestError = exports.updateFinalized = exports.getDisplayName = exports.getExtrinsicSuccessOrErrorMessage = exports.processLog = exports.processLogs = exports.processEvent = exports.processEvents = exports.processTransfer = exports.processExtrinsic = exports.processExtrinsics = exports.updateAccountInfo = exports.updateAccountsInfo = exports.isValidAddressPolkadotAddress = exports.dbParamQuery = exports.dbQuery = exports.getClient = exports.wait = exports.shortHash = exports.formatNumber = exports.isNodeSynced = exports.getPolkadotAPI = void 0;
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const pino_1 = __importDefault(require("pino"));
require("@polkadot/api-augment/kusama");
const api_1 = require("@polkadot/api");
const keyring_1 = require("@polkadot/keyring");
const util_1 = require("@polkadot/util");
const pg_1 = require("pg");
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const backend_config_1 = require("../backend.config");
const bignumber_js_1 = require("bignumber.js");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const logger = (0, pino_1.default)();
// Used for processing events and extrinsics
const chunkSize = 100;
const getPolkadotAPI = (loggerOptions, apiCustomTypes) => __awaiter(void 0, void 0, void 0, function* () {
    let api;
    logger.debug(loggerOptions, `Connecting to ${backend_config_1.backendConfig.wsProviderUrl}`);
    const provider = new api_1.WsProvider(backend_config_1.backendConfig.wsProviderUrl);
    if (apiCustomTypes && apiCustomTypes !== '') {
        const types = JSON.parse(fs_1.default.readFileSync(`./src/types/${apiCustomTypes}`, 'utf8'));
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
    catch (error) {
        logger.error(loggerOptions, "Can't query node status");
        Sentry.captureException(error);
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
const shortHash = (hash) => `${hash.substring(0, 6)}…${hash.substring(hash.length - 5, hash.length - 1)}`;
exports.shortHash = shortHash;
const wait = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        return setTimeout(resolve, ms);
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
        Sentry.captureException(error);
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
        Sentry.captureException(error);
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
        Sentry.captureException(error);
        return false;
    }
};
exports.isValidAddressPolkadotAddress = isValidAddressPolkadotAddress;
const updateAccountsInfo = (api, client, blockNumber, timestamp, loggerOptions, blockEvents) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    const involvedAddresses = [];
    blockEvents
        .forEach(({ event }) => {
        const types = event.typeDef;
        event.data.forEach((data, index) => {
            if (types[index].type === 'AccountId32') {
                involvedAddresses.push(data.toString());
            }
        });
    });
    const uniqueAddresses = lodash_1.default.uniq(involvedAddresses);
    yield Promise.all(uniqueAddresses.map((address) => (0, exports.updateAccountInfo)(api, client, blockNumber, timestamp, address, loggerOptions)));
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
        yield client.query(query, data);
        logger.debug(loggerOptions, `Updated account info for event/s involved address ${address}`);
    }
    catch (error) {
        logger.error(loggerOptions, `Error updating account info for event/s involved address: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    }
});
exports.updateAccountInfo = updateAccountInfo;
const processExtrinsics = (api, client, blockNumber, blockHash, extrinsics, blockEvents, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    const indexedExtrinsics = extrinsics.map((extrinsic, index) => ([index, extrinsic]));
    const chunks = (0, exports.chunker)(indexedExtrinsics, chunkSize);
    for (const chunk of chunks) {
        yield Promise.all(chunk.map((indexedExtrinsic) => (0, exports.processExtrinsic)(api, client, blockNumber, blockHash, indexedExtrinsic, blockEvents, timestamp, loggerOptions)));
    }
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
});
exports.processExtrinsics = processExtrinsics;
const processExtrinsic = (api, client, blockNumber, blockHash, indexedExtrinsic, blockEvents, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const [extrinsicIndex, extrinsic] = indexedExtrinsic;
    const { isSigned } = extrinsic;
    const signer = isSigned ? extrinsic.signer.toString() : '';
    const section = extrinsic.method.section;
    const method = extrinsic.method.method;
    const args = JSON.stringify(extrinsic.args);
    const hash = extrinsic.hash.toHex();
    const doc = extrinsic.meta.docs.toString().replace(/'/g, "''");
    // See: https://polkadot.js.org/docs/api/cookbook/blocks/#how-do-i-determine-if-an-extrinsic-succeededfailed
    const [success, errorMessage] = (0, exports.getExtrinsicSuccessOrErrorMessage)(api, extrinsicIndex, blockEvents);
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
      '${extrinsicIndex}',
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
        yield client.query(sql);
        logger.debug(loggerOptions, `Added extrinsic ${blockNumber}-${extrinsicIndex} (${(0, exports.shortHash)(hash)}) ${section} ➡ ${method}`);
    }
    catch (error) {
        logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
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
      '${extrinsicIndex}',
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
            yield client.query(sql);
            logger.debug(loggerOptions, `Added signed extrinsic ${blockNumber}-${extrinsicIndex} (${(0, exports.shortHash)(hash)}) ${section} ➡ ${method}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding signed extrinsic ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
            Sentry.captureException(error);
        }
        if (section === 'balances' && (method === 'forceTransfer' || method === 'transfer' || method === 'transferAll' || method === 'transferKeepAlive')) {
            // Store transfer
            (0, exports.processTransfer)(client, blockNumber, extrinsicIndex, blockEvents, section, method, args, hash.toString(), signer, feeInfo, success, errorMessage, timestamp, loggerOptions);
        }
    }
});
exports.processExtrinsic = processExtrinsic;
// TODO: Use in multiple extrinsics included in utility.batch and proxy.proxy
const processTransfer = (client, blockNumber, extrinsicIndex, blockEvents, section, method, args, hash, signer, feeInfo, success, errorMessage, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    // Store transfer
    const source = signer;
    const destination = JSON.parse(args)[0].id
        ? JSON.parse(args)[0].id
        : JSON.parse(args)[0].address20;
    let amount;
    if (method === 'transferAll' && success) {
        amount = (0, exports.getTransferAllAmount)(extrinsicIndex, blockEvents);
    }
    else if (method === 'transferAll' && !success) {
        // We can't get amount in this case cause no event is emitted
        amount = 0;
    }
    else if (method === 'forceTransfer') {
        amount = JSON.parse(args)[2];
    }
    else {
        amount = JSON.parse(args)[1]; // 'transfer' and 'transferKeepAlive' methods
    }
    const feeAmount = JSON.parse(feeInfo).partialFee;
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
      '${blockNumber}',
      '${extrinsicIndex}',
      '${section}',
      '${method}',
      '${hash}',
      '${source}',
      '${destination}',
      '${new bignumber_js_1.BigNumber(amount).toString(10)}',
      '${new bignumber_js_1.BigNumber(feeAmount).toString(10)}',
      '${success}',
      '${errorMessage}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT transfer_pkey 
    DO NOTHING;
    ;`;
    try {
        yield client.query(sql);
        logger.debug(loggerOptions, `Added transfer ${blockNumber}-${extrinsicIndex} (${(0, exports.shortHash)(hash.toString())}) ${section} ➡ ${method}`);
    }
    catch (error) {
        logger.error(loggerOptions, `Error adding transfer ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    }
});
exports.processTransfer = processTransfer;
const processEvents = (api, runtimeVersion, client, blockNumber, blockHash, activeEra, blockEvents, blockExtrinsics, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    const indexedBlockEvents = blockEvents.map((event, index) => ([index, event]));
    const indexedBlockExtrinsics = blockExtrinsics.map((extrinsic, index) => ([index, extrinsic]));
    const chunks = (0, exports.chunker)(indexedBlockEvents, chunkSize);
    for (const chunk of chunks) {
        yield Promise.all(chunk.map((indexedEvent) => (0, exports.processEvent)(api, runtimeVersion, client, blockNumber, blockHash, activeEra, indexedEvent, indexedBlockEvents, indexedBlockExtrinsics, timestamp, loggerOptions)));
    }
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
});
exports.processEvents = processEvents;
const processEvent = (api, runtimeVersion, client, blockNumber, blockHash, activeEra, indexedEvent, indexedBlockEvents, indexedBlockExtrinsics, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const [eventIndex, { event, phase }] = indexedEvent;
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
    '${eventIndex}',
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
        yield client.query(sql);
        logger.debug(loggerOptions, `Added event #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
    }
    catch (error) {
        logger.error(loggerOptions, `Error adding event #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
        Sentry.captureException(error);
    }
    // Runtime upgrade
    if (event.section === 'system' && event.method === 'CodeUpdated') {
        const specName = runtimeVersion.toJSON().specName;
        const specVersion = runtimeVersion.specVersion;
        const metadata = yield api.rpc.state.getMetadata(blockHash);
        const data = [
            blockNumber,
            specName,
            specVersion,
            metadata.version,
            metadata.magicNumber,
            metadata.asLatest.toJSON(),
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
    ON CONFLICT ON CONSTRAINT runtime_pkey 
    DO NOTHING
    ;`;
        yield (0, exports.dbParamQuery)(client, query, data, loggerOptions);
    }
    // Store staking reward
    if (event.section === 'staking' && (event.method === 'Reward' || event.method === 'Rewarded')) {
        //
        // Store validator stash address and era index
        //
        let validator = null;
        let era = null;
        const payoutStakersExtrinsic = indexedBlockExtrinsics
            .find(([extrinsicIndex, { method: { section, method } }]) => (phase.asApplyExtrinsic.eq(extrinsicIndex) // event phase
            && section === 'staking'
            && method === 'payoutStakers'));
        if (payoutStakersExtrinsic) {
            validator = payoutStakersExtrinsic[1].method.args[0];
            era = payoutStakersExtrinsic[1].method.args[1];
        }
        else {
            // TODO: support era/validator extraction for staking.payoutValidator and staking.payoutNominator
            //
            // staking.payoutStakers extrinsic included in a utility.batch or utility.batchAll extrinsic
            //
            const utilityBatchExtrinsicIndexes = indexedBlockExtrinsics
                .filter(([extrinsicIndex, extrinsic]) => (phase.asApplyExtrinsic.eq(extrinsicIndex) // event phase
                && extrinsic.method.section === 'utility'
                && (extrinsic.method.method === 'batch' || extrinsic.method.method === 'batchAll')))
                .map(([index, _]) => index);
            if (utilityBatchExtrinsicIndexes.length > 0) {
                // We know that utility.batch has some staking.payoutStakers extrinsic
                // Then we need to do a lookup of the previous staking.payoutStarted 
                // event to get validator and era
                const payoutStartedEvents = indexedBlockEvents.filter(([_, record]) => (record.phase.isApplyExtrinsic
                    && utilityBatchExtrinsicIndexes.includes(record.phase.asApplyExtrinsic.toNumber()) // events should be related to utility.batch extrinsic
                    && record.event.section === 'staking'
                    && record.event.method === 'PayoutStarted')).reverse();
                if (payoutStartedEvents) {
                    const payoutStartedEvent = payoutStartedEvents.find(([index, _]) => index < eventIndex);
                    if (payoutStartedEvent) {
                        [era, validator] = payoutStartedEvent[1].event.data;
                    }
                }
            }
            else {
                //
                // staking.payoutStakers extrinsic included in a proxy.proxy extrinsic
                //
                const proxyProxyExtrinsicIndexes = indexedBlockExtrinsics
                    .filter(([extrinsicIndex, extrinsic]) => (phase.asApplyExtrinsic.eq(extrinsicIndex) // event phase
                    && extrinsic.method.section === 'proxy'
                    && extrinsic.method.method === 'proxy'))
                    .map(([index, _]) => index);
                if (proxyProxyExtrinsicIndexes.length > 0) {
                    // We know that proxy.proxy has some staking.payoutStakers extrinsic
                    // Then we need to do a lookup of the previous staking.payoutStarted 
                    // event to get validator and era
                    const payoutStartedEvents = indexedBlockEvents.filter(([_, record]) => (record.phase.isApplyExtrinsic
                        && proxyProxyExtrinsicIndexes.includes(record.phase.asApplyExtrinsic.toNumber()) // events should be related to proxy.proxy extrinsic
                        && record.event.section === 'staking'
                        && record.event.method === 'PayoutStarted')).reverse();
                    if (payoutStartedEvents) {
                        const payoutStartedEvent = payoutStartedEvents.find(([index, _]) => index < eventIndex);
                        if (payoutStartedEvent) {
                            [era, validator] = payoutStartedEvent[1].event.data;
                        }
                    }
                }
            }
        }
        if (validator && era) {
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
        '${eventIndex}',
        '${event.data[0]}',
        '${validator}',
        '${era}',
        '${new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10)}',
        '${timestamp}'
      )
      ON CONFLICT ON CONSTRAINT staking_reward_pkey 
      DO NOTHING
      ;`;
        }
        else {
            sql = `INSERT INTO staking_reward (
        block_number,
        event_index,
        account_id,
        amount,
        timestamp
      ) VALUES (
        '${blockNumber}',
        '${eventIndex}',
        '${event.data[0]}',
        '${new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10)}',
        '${timestamp}'
      )
      ON CONFLICT ON CONSTRAINT staking_reward_pkey 
      DO NOTHING
      ;`;
        }
        try {
            yield client.query(sql);
            logger.debug(loggerOptions, `Added staking reward #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding staking reward #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
            Sentry.captureException(error);
        }
    }
    //
    // TODO: store validator and era index
    // -> era is previous era
    // -> validator account id is in staking.Slashed event
    //
    // Store validator staking slash
    if (event.section === 'staking' && (event.method === 'Slash' || event.method === 'Slashed')) {
        sql = `INSERT INTO staking_slash (
      block_number,
      event_index,
      account_id,
      validator_stash_address,
      era,
      amount,
      timestamp
    ) VALUES (
      '${blockNumber}',
      '${eventIndex}',
      '${event.data[0]}',
      '${event.data[0]}',
      '${activeEra - 1}',
      '${new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10)}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT staking_slash_pkey 
    DO NOTHING
    ;`;
        try {
            yield client.query(sql);
            logger.debug(loggerOptions, `Added validator staking slash #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding validator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
            Sentry.captureException(error);
        }
    }
    // Store nominator staking slash
    if (event.section === 'balances' && (event.method === 'Slash' || event.method === 'Slashed')) {
        const validator_stash_address = (0, exports.getSlashedValidatorAccount)(eventIndex, indexedBlockEvents);
        sql = `INSERT INTO staking_slash (
      block_number,
      event_index,
      account_id,
      validator_stash_address,
      era,
      amount,
      timestamp
    ) VALUES (
      '${blockNumber}',
      '${eventIndex}',
      '${event.data[0]}',
      '${validator_stash_address}',
      '${activeEra - 1}',
      '${new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10)}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT staking_slash_pkey 
    DO NOTHING
    ;`;
        try {
            yield client.query(sql);
            logger.debug(loggerOptions, `Added nominator staking slash #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding nominator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
            Sentry.captureException(error);
        }
    }
});
exports.processEvent = processEvent;
const processLogs = (client, blockNumber, logs, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    yield Promise.all(logs.map((log, index) => (0, exports.processLog)(client, blockNumber, log, index, timestamp, loggerOptions)));
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
});
exports.processLogs = processLogs;
const processLog = (client, blockNumber, log, index, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { type } = log;
    const [[engine, data]] = Object.values(log.toHuman());
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
        Sentry.captureException(error);
    }
});
exports.processLog = processLog;
const getExtrinsicSuccessOrErrorMessage = (api, index, blockEvents) => {
    let extrinsicSuccess = false;
    let extrinsicErrorMessage = '';
    blockEvents
        .filter(({ phase }) => phase.isApplyExtrinsic &&
        phase.asApplyExtrinsic.eq(index))
        .forEach(({ event }) => {
        if (api.events.system.ExtrinsicSuccess.is(event)) {
            extrinsicSuccess = true;
        }
        else if (api.events.system.ExtrinsicFailed.is(event)) {
            // extract the data for this event
            const [dispatchError] = event.data;
            // decode the error
            if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                // (For specific known errors, we can also do a check against the
                // api.errors.<module>.<ErrorName>.is(dispatchError.asModule) guard)
                const decoded = api.registry.findMetaError(dispatchError.asModule);
                extrinsicErrorMessage = `${decoded.section}.${decoded.name}`;
            }
            else {
                // Other, CannotLookup, BadOrigin, no extra info
                extrinsicErrorMessage = dispatchError.toString();
            }
        }
    });
    return [extrinsicSuccess, extrinsicErrorMessage];
};
exports.getExtrinsicSuccessOrErrorMessage = getExtrinsicSuccessOrErrorMessage;
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
const updateFinalized = (client, finalizedBlock, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const sql = `
    UPDATE block SET finalized = true WHERE finalized = false AND block_number <= ${finalizedBlock};
  `;
    try {
        yield client.query(sql);
    }
    catch (error) {
        logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
        Sentry.captureException(error);
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
    yield (0, exports.dbParamQuery)(client, query, data, loggerOptions);
});
exports.logHarvestError = logHarvestError;
const chunker = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
exports.chunker = chunker;
// Return a reverse ordered array filled from range
const reverseRange = (start, stop, step) => Array
    .from({ length: (stop - start) / step + 1 }, (_, i) => stop - (i * step));
exports.reverseRange = reverseRange;
// Return filled array from range
const range = (start, stop, step) => Array
    .from({ length: (stop - start) / step + 1 }, (_, i) => start + (i * step));
exports.range = range;
// TODO: Figure out what happens when the extrinsic balances.transferAll is included in a utility.batch or proxy.proxy extrinsic
const getTransferAllAmount = (index, blockEvents) => blockEvents
    .find(({ event, phase }) => (phase.isApplyExtrinsic
    && phase.asApplyExtrinsic.eq(index)
    && event.section === 'balances'
    && event.method === 'Transfer')).event.data[2].toString();
exports.getTransferAllAmount = getTransferAllAmount;
const getSlashedValidatorAccount = (index, indexedBlockEvents) => {
    let validatorAccountId = '';
    for (let i = index; i >= 0; i--) {
        const { event } = indexedBlockEvents[i][1];
        if (event.section === 'staking' && (event.method === 'Slash' || event.method === 'Slashed')) {
            return validatorAccountId = event.data[0].toString();
        }
    }
    return validatorAccountId;
};
exports.getSlashedValidatorAccount = getSlashedValidatorAccount;
const healthCheck = (config, client, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
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
    const res = yield (0, exports.dbQuery)(client, query, loggerOptions);
    for (const row of res.rows) {
        logger.info(loggerOptions, `Health check failed for block #${row.block_number}, deleting block from block table!`);
        yield (0, exports.dbQuery)(client, `DELETE FROM block WHERE block_number = '${row.block_number}';`, loggerOptions);
    }
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Health check finished in ${((endTime - startTime) / 1000).toFixed(config.statsPrecision)}s`);
});
exports.healthCheck = healthCheck;
const harvestBlock = (config, api, client, blockNumber, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    try {
        const blockHash = yield api.rpc.chain.getBlockHash(blockNumber);
        const apiAt = yield api.at(blockHash);
        const [{ block }, blockEvents, blockHeader, totalIssuance, runtimeVersion, activeEra, currentIndex, chainElectionStatus, timestamp,] = yield Promise.all([
            api.rpc.chain.getBlock(blockHash),
            apiAt.query.system.events(),
            api.derive.chain.getHeader(blockHash),
            apiAt.query.balances.totalIssuance(),
            api.rpc.state.getRuntimeVersion(blockHash),
            apiAt.query.staking.activeEra()
                .then((res) => (res.toJSON() ? res.toJSON().index : 0))
                .catch((e) => { console.log(e); return 0; }),
            apiAt.query.session.currentIndex()
                .then((res) => (res || 0)),
            apiAt.query.electionProviderMultiPhase.currentPhase(),
            apiAt.query.timestamp.now(),
        ]);
        const blockAuthor = blockHeader.author || '';
        const blockAuthorIdentity = yield api.derive.accounts.info(blockHeader.author);
        const blockAuthorName = (0, exports.getDisplayName)(blockAuthorIdentity.identity);
        const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;
        // Get election status
        const isElection = Object.getOwnPropertyNames(chainElectionStatus.toJSON())[0] !== 'off';
        // Totals
        const totalEvents = blockEvents.length;
        const totalExtrinsics = block.extrinsics.length;
        const sqlInsert = `INSERT INTO block (
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
        '${blockNumber}',
        false,
        '${blockAuthor}',
        '${blockAuthorName}',
        '${blockHash}',
        '${parentHash}',
        '${extrinsicsRoot}',
        '${stateRoot}',
        '${activeEra}',
        '${currentIndex}',
        '${isElection}',
        '${runtimeVersion.specVersion}',
        '${totalEvents}',
        '${totalExtrinsics}',
        '${totalIssuance.toString()}',
        '${timestamp}'
      )
      ON CONFLICT ON CONSTRAINT block_pkey 
      DO NOTHING
      ;`;
        try {
            yield (0, exports.dbQuery)(client, sqlInsert, loggerOptions);
            const endTime = new Date().getTime();
            logger.info(loggerOptions, `Added block #${blockNumber} (${(0, exports.shortHash)(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(config.statsPrecision)}s`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
            Sentry.captureException(error);
        }
        yield Promise.all([
            // Store block extrinsics (async)
            (0, exports.processExtrinsics)(api, client, blockNumber, blockHash, block.extrinsics, blockEvents, timestamp.toNumber(), loggerOptions),
            // Store module events (async)
            (0, exports.processEvents)(api, runtimeVersion, client, blockNumber, blockHash, parseInt(activeEra.toString()), blockEvents, block.extrinsics, timestamp.toNumber(), loggerOptions),
            // Store block logs (async)
            (0, exports.processLogs)(client, blockNumber, blockHeader.digest.logs, timestamp.toNumber(), loggerOptions),
        ]);
    }
    catch (error) {
        logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
        yield (0, exports.logHarvestError)(client, blockNumber, error, loggerOptions);
        Sentry.captureException(error);
    }
});
exports.harvestBlock = harvestBlock;
// eslint-disable-next-line no-unused-vars
const harvestBlocksSeq = (config, api, client, startBlock, endBlock, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const reverseOrder = true;
    const blocks = reverseOrder
        ? (0, exports.reverseRange)(startBlock, endBlock, 1)
        : (0, exports.range)(startBlock, endBlock, 1);
    const blockProcessingTimes = [];
    let maxTimeMs = 0;
    let minTimeMs = 1000000;
    let avgTimeMs = 0;
    for (const blockNumber of blocks) {
        const blockStartTime = Date.now();
        yield (0, exports.harvestBlock)(config, api, client, blockNumber, loggerOptions);
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
        avgTimeMs = blockProcessingTimes.reduce((sum, blockProcessingTime) => sum + blockProcessingTime, 0) / blockProcessingTimes.length;
        const completed = ((blocks.indexOf(blockNumber) + 1) * 100) / blocks.length;
        logger.info(loggerOptions, `Processed block #${blockNumber} ${blocks.indexOf(blockNumber) + 1}/${blocks.length} [${completed.toFixed(config.statsPrecision)}%] in ${((blockProcessingTimeMs) / 1000).toFixed(config.statsPrecision)}s min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)}`);
    }
});
exports.harvestBlocksSeq = harvestBlocksSeq;
const harvestBlocks = (config, api, client, startBlock, endBlock, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const reverseOrder = true;
    const blocks = reverseOrder
        ? (0, exports.reverseRange)(startBlock, endBlock, 1)
        : (0, exports.range)(startBlock, endBlock, 1);
    const chunks = (0, exports.chunker)(blocks, config.chunkSize);
    logger.info(loggerOptions, `Processing chunks of ${config.chunkSize} blocks`);
    const chunkProcessingTimes = [];
    let maxTimeMs = 0;
    let minTimeMs = 1000000;
    let avgTimeMs = 0;
    let avgBlocksPerSecond = 0;
    for (const chunk of chunks) {
        const chunkStartTime = Date.now();
        yield Promise.all(chunk.map((blockNumber) => (0, exports.harvestBlock)(config, api, client, blockNumber, loggerOptions)));
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
        avgTimeMs = chunkProcessingTimes.reduce((sum, chunkProcessingTime) => sum + chunkProcessingTime, 0) / chunkProcessingTimes.length;
        avgBlocksPerSecond = 1 / ((avgTimeMs / 1000) / config.chunkSize);
        const currentBlocksPerSecond = 1 / ((chunkProcessingTimeMs / 1000) / config.chunkSize);
        const completed = ((chunks.indexOf(chunk) + 1) * 100) / chunks.length;
        logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} [${completed.toFixed(config.statsPrecision)}%] `
            + `in ${((chunkProcessingTimeMs) / 1000).toFixed(config.statsPrecision)}s `
            + `min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)} `
            + `cur/avg bps: ${currentBlocksPerSecond.toFixed(config.statsPrecision)}/${avgBlocksPerSecond.toFixed(config.statsPrecision)}`);
    }
});
exports.harvestBlocks = harvestBlocks;

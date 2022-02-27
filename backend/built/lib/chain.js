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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertEraValidatorStatsAvg = exports.getLastEraInDb = exports.getAddressCreation = exports.insertEraValidatorStats = exports.insertRankingValidator = exports.addNewFeaturedValidator = exports.getClusterInfo = exports.getPayoutRating = exports.getCommissionRating = exports.getCommissionHistory = exports.parseIdentity = exports.getIdentityRating = exports.subIdentity = exports.getClusterName = exports.getName = exports.isVerifiedIdentity = exports.getThousandValidators = exports.processAccountsChunk = exports.fetchAccountIds = exports.getAccountIdFromArgs = exports.harvestBlocks = exports.harvestBlocksSeq = exports.harvestBlock = exports.storeMetadata = exports.healthCheck = exports.logHarvestError = exports.updateFinalized = exports.getDisplayName = exports.processLogs = exports.processLog = exports.processEvents = exports.processEvent = exports.getSlashedValidatorAccount = exports.processExtrinsics = exports.processExtrinsic = exports.processTransfer = exports.getTransferAllAmount = exports.getExtrinsicSuccessOrErrorMessage = exports.updateAccountsInfo = exports.updateAccountInfo = exports.isValidAddressPolkadotAddress = exports.dbParamQuery = exports.dbQuery = exports.getClient = exports.isNodeSynced = exports.getPolkadotAPI = void 0;
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
require("@polkadot/api-augment");
const api_1 = require("@polkadot/api");
const keyring_1 = require("@polkadot/keyring");
const util_1 = require("@polkadot/util");
const axios_1 = __importDefault(require("axios"));
const pino_1 = __importDefault(require("pino"));
const pg_1 = require("pg");
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const bignumber_js_1 = require("bignumber.js");
const utils_1 = require("./utils");
const backend_config_1 = require("../backend.config");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const logger = (0, pino_1.default)({
    level: backend_config_1.backendConfig.logLevel,
});
// Used for processing events and extrinsics
const chunkSize = 100;
const getPolkadotAPI = async (loggerOptions, apiCustomTypes) => {
    let api;
    logger.debug(loggerOptions, `Connecting to ${backend_config_1.backendConfig.wsProviderUrl}`);
    const provider = new api_1.WsProvider(backend_config_1.backendConfig.wsProviderUrl);
    if (apiCustomTypes && apiCustomTypes !== '') {
        const types = JSON.parse(fs_1.default.readFileSync(`./src/types/${apiCustomTypes}`, 'utf8'));
        api = await api_1.ApiPromise.create({ provider, types });
    }
    else {
        api = await api_1.ApiPromise.create({ provider });
    }
    await api.isReady;
    return api;
};
exports.getPolkadotAPI = getPolkadotAPI;
const isNodeSynced = async (api, loggerOptions) => {
    let node;
    try {
        node = await api.rpc.system.health();
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
};
exports.isNodeSynced = isNodeSynced;
const getClient = async (loggerOptions) => {
    logger.debug(loggerOptions, `Connecting to DB ${backend_config_1.backendConfig.postgresConnParams.database} at ${backend_config_1.backendConfig.postgresConnParams.host}:${backend_config_1.backendConfig.postgresConnParams.port}`);
    const client = new pg_1.Client(backend_config_1.backendConfig.postgresConnParams);
    await client.connect();
    return client;
};
exports.getClient = getClient;
const dbQuery = async (client, sql, loggerOptions) => {
    try {
        return await client.query(sql);
    }
    catch (error) {
        logger.error(loggerOptions, `SQL: ${sql} ERROR: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    }
    return null;
};
exports.dbQuery = dbQuery;
const dbParamQuery = async (client, sql, data, loggerOptions) => {
    try {
        return await client.query(sql, data);
    }
    catch (error) {
        logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    }
    return null;
};
exports.dbParamQuery = dbParamQuery;
const isValidAddressPolkadotAddress = (address) => {
    try {
        (0, keyring_1.encodeAddress)((0, util_1.isHex)(address) ? (0, util_1.hexToU8a)(address.toString()) : (0, keyring_1.decodeAddress)(address));
        return true;
    }
    catch (error) {
        Sentry.captureException(error);
        return false;
    }
};
exports.isValidAddressPolkadotAddress = isValidAddressPolkadotAddress;
const updateAccountInfo = async (api, client, blockNumber, timestamp, address, loggerOptions) => {
    const [balances, { identity }] = await Promise.all([
        api.derive.balances.all(address),
        api.derive.accounts.info(address),
    ]);
    const accountId = balances.accountId.toHuman(); // ImOnline.HeartbeatReceived events return public key addresses but we want SS58 encoded address
    const availableBalance = balances.availableBalance.toString();
    const freeBalance = balances.freeBalance.toString();
    const lockedBalance = balances.lockedBalance.toString();
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
    }
    catch (error) {
        logger.error(loggerOptions, `Error updating account info for event/s involved address: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    }
};
exports.updateAccountInfo = updateAccountInfo;
const updateAccountsInfo = async (api, client, blockNumber, timestamp, loggerOptions, blockEvents) => {
    const startTime = new Date().getTime();
    const involvedAddresses = [];
    blockEvents.forEach(({ event }) => {
        const types = event.typeDef;
        event.data.forEach((data, index) => {
            if (types[index].type === 'AccountId32') {
                involvedAddresses.push(data.toString());
            }
        });
    });
    const uniqueAddresses = lodash_1.default.uniq(involvedAddresses);
    await Promise.all(uniqueAddresses.map((address) => (0, exports.updateAccountInfo)(api, client, blockNumber, timestamp, address, loggerOptions)));
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Updated ${uniqueAddresses.length} accounts in ${((endTime - startTime) /
        1000).toFixed(3)}s`);
};
exports.updateAccountsInfo = updateAccountsInfo;
const getExtrinsicSuccessOrErrorMessage = (apiAt, index, blockEvents) => {
    let extrinsicSuccess = false;
    let extrinsicErrorMessage = '';
    blockEvents
        .filter(({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index))
        .forEach(({ event }) => {
        if (apiAt.events.system.ExtrinsicSuccess.is(event)) {
            extrinsicSuccess = true;
        }
        else if (apiAt.events.system.ExtrinsicFailed.is(event)) {
            const [dispatchError] = event.data;
            if (dispatchError.isModule) {
                const decoded = apiAt.registry.findMetaError(dispatchError.asModule);
                extrinsicErrorMessage = `${decoded.name}: ${decoded.docs}`;
            }
            else {
                extrinsicErrorMessage = dispatchError.toString();
            }
        }
    });
    return [extrinsicSuccess, extrinsicErrorMessage];
};
exports.getExtrinsicSuccessOrErrorMessage = getExtrinsicSuccessOrErrorMessage;
const getTransferAllAmount = (blockNumber, index, blockEvents) => {
    try {
        return blockEvents
            .find(({ event, phase }) => phase.isApplyExtrinsic &&
            phase.asApplyExtrinsic.eq(index) &&
            event.section === 'balances' &&
            event.method === 'Transfer')
            .event.data[2].toString();
    }
    catch (error) {
        const scope = new Sentry.Scope();
        scope.setTag('blockNumber', blockNumber);
        Sentry.captureException(error, scope);
    }
};
exports.getTransferAllAmount = getTransferAllAmount;
// TODO: Use in multiple extrinsics included in utility.batch and proxy.proxy
const processTransfer = async (client, blockNumber, extrinsicIndex, blockEvents, section, method, args, hash, signer, feeInfo, success, errorMessage, timestamp, loggerOptions) => {
    // Store transfer
    const source = signer;
    const destination = JSON.parse(args)[0].id
        ? JSON.parse(args)[0].id
        : JSON.parse(args)[0].address20;
    let amount;
    if (method === 'transferAll' && success) {
        // Equal source and destination addres doesn't trigger a balances.Transfer event
        amount =
            source === destination
                ? 0
                : (0, exports.getTransferAllAmount)(blockNumber, extrinsicIndex, blockEvents);
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
    const data = [
        blockNumber,
        extrinsicIndex,
        section,
        method,
        hash,
        source,
        destination,
        new bignumber_js_1.BigNumber(amount).toString(10),
        new bignumber_js_1.BigNumber(feeAmount).toString(10),
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
        logger.debug(loggerOptions, `Added transfer ${blockNumber}-${extrinsicIndex} (${(0, utils_1.shortHash)(hash.toString())}) ${section} ➡ ${method}`);
    }
    catch (error) {
        logger.error(loggerOptions, `Error adding transfer ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
        const scope = new Sentry.Scope();
        scope.setTag('blockNumber', blockNumber);
        Sentry.captureException(error, scope);
    }
};
exports.processTransfer = processTransfer;
const processExtrinsic = async (api, apiAt, client, blockNumber, blockHash, indexedExtrinsic, blockEvents, timestamp, loggerOptions) => {
    const [extrinsicIndex, extrinsic] = indexedExtrinsic;
    const { isSigned } = extrinsic;
    const signer = isSigned ? extrinsic.signer.toString() : '';
    const section = extrinsic.method.section;
    const method = extrinsic.method.method;
    const args = JSON.stringify(extrinsic.args);
    const hash = extrinsic.hash.toHex();
    const doc = JSON.stringify(extrinsic.meta.docs.toJSON());
    // See: https://polkadot.js.org/docs/api/cookbook/blocks/#how-do-i-determine-if-an-extrinsic-succeededfailed
    const [success, errorMessage] = (0, exports.getExtrinsicSuccessOrErrorMessage)(apiAt, extrinsicIndex, blockEvents);
    let feeInfo = '';
    let feeDetails = '';
    if (isSigned) {
        [feeInfo, feeDetails] = await Promise.all([
            api.rpc.payment
                .queryInfo(extrinsic.toHex(), blockHash)
                .then((result) => JSON.stringify(result.toJSON()))
                .catch((error) => logger.debug(loggerOptions, `API Error: ${error}`)) ||
                '',
            api.rpc.payment
                .queryFeeDetails(extrinsic.toHex(), blockHash)
                .then((result) => JSON.stringify(result.toJSON()))
                .catch((error) => logger.debug(loggerOptions, `API Error: ${error}`)) ||
                '',
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
        timestamp,
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
        logger.debug(loggerOptions, `Added extrinsic ${blockNumber}-${extrinsicIndex} (${(0, utils_1.shortHash)(hash)}) ${section} ➡ ${method}`);
    }
    catch (error) {
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
            timestamp,
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
            logger.debug(loggerOptions, `Added signed extrinsic ${blockNumber}-${extrinsicIndex} (${(0, utils_1.shortHash)(hash)}) ${section} ➡ ${method}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding signed extrinsic ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
            Sentry.captureException(error);
        }
        if (section === 'balances' &&
            (method === 'forceTransfer' ||
                method === 'transfer' ||
                method === 'transferAll' ||
                method === 'transferKeepAlive')) {
            // Store transfer
            (0, exports.processTransfer)(client, blockNumber, extrinsicIndex, blockEvents, section, method, args, hash.toString(), signer, feeInfo, success, errorMessage, timestamp, loggerOptions);
        }
    }
};
exports.processExtrinsic = processExtrinsic;
const processExtrinsics = async (api, apiAt, client, blockNumber, blockHash, extrinsics, blockEvents, timestamp, loggerOptions) => {
    const startTime = new Date().getTime();
    const indexedExtrinsics = extrinsics.map((extrinsic, index) => [index, extrinsic]);
    const chunks = (0, utils_1.chunker)(indexedExtrinsics, chunkSize);
    for (const chunk of chunks) {
        await Promise.all(chunk.map((indexedExtrinsic) => (0, exports.processExtrinsic)(api, apiAt, client, blockNumber, blockHash, indexedExtrinsic, blockEvents, timestamp, loggerOptions)));
    }
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) /
        1000).toFixed(3)}s`);
};
exports.processExtrinsics = processExtrinsics;
const getSlashedValidatorAccount = (index, IndexedBlockEvents) => {
    let validatorAccountId = '';
    for (let i = index; i >= 0; i--) {
        const { event } = IndexedBlockEvents[i][1];
        if (event.section === 'staking' &&
            (event.method === 'Slash' || event.method === 'Slashed')) {
            return (validatorAccountId = event.data[0].toString());
        }
    }
    return validatorAccountId;
};
exports.getSlashedValidatorAccount = getSlashedValidatorAccount;
const processEvent = async (client, blockNumber, activeEra, indexedEvent, IndexedBlockEvents, IndexedBlockExtrinsics, timestamp, loggerOptions) => {
    const [eventIndex, { event, phase }] = indexedEvent;
    const data = [
        blockNumber,
        eventIndex,
        event.section,
        event.method,
        phase.toString(),
        JSON.stringify(event.data),
        timestamp,
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
    }
    catch (error) {
        logger.error(loggerOptions, `Error adding event #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
        Sentry.captureException(error);
    }
    // Store staking reward
    if (event.section === 'staking' &&
        (event.method === 'Reward' || event.method === 'Rewarded')) {
        //
        // Store validator stash address and era index
        //
        let validator = null;
        let era = null;
        let sql;
        let data = [];
        const payoutStakersExtrinsic = IndexedBlockExtrinsics.find(([extrinsicIndex, { method: { section, method }, },]) => phase.asApplyExtrinsic.eq(extrinsicIndex) && // event phase
            section === 'staking' &&
            method === 'payoutStakers');
        if (payoutStakersExtrinsic) {
            validator = payoutStakersExtrinsic[1].method.args[0];
            era = payoutStakersExtrinsic[1].method.args[1];
        }
        else {
            // TODO: support era/validator extraction for staking.payoutValidator and staking.payoutNominator
            //
            // staking.payoutStakers extrinsic included in a utility.batch or utility.batchAll extrinsic
            //
            const utilityBatchExtrinsicIndexes = IndexedBlockExtrinsics.filter(([extrinsicIndex, extrinsic]) => phase.asApplyExtrinsic.eq(extrinsicIndex) && // event phase
                extrinsic.method.section === 'utility' &&
                (extrinsic.method.method === 'batch' ||
                    extrinsic.method.method === 'batchAll')).map(([index]) => index);
            if (utilityBatchExtrinsicIndexes.length > 0) {
                // We know that utility.batch has some staking.payoutStakers extrinsic
                // Then we need to do a lookup of the previous staking.payoutStarted
                // event to get validator and era
                const payoutStartedEvents = IndexedBlockEvents.filter(([, record]) => record.phase.isApplyExtrinsic &&
                    utilityBatchExtrinsicIndexes.includes(record.phase.asApplyExtrinsic.toNumber()) && // events should be related to utility.batch extrinsic
                    record.event.section === 'staking' &&
                    record.event.method === 'PayoutStarted').reverse();
                if (payoutStartedEvents) {
                    const payoutStartedEvent = payoutStartedEvents.find(([index]) => index < eventIndex);
                    if (payoutStartedEvent) {
                        [era, validator] = payoutStartedEvent[1].event.data;
                    }
                }
            }
            else {
                //
                // staking.payoutStakers extrinsic included in a proxy.proxy extrinsic
                //
                const proxyProxyExtrinsicIndexes = IndexedBlockExtrinsics.filter(([extrinsicIndex, extrinsic]) => phase.asApplyExtrinsic.eq(extrinsicIndex) && // event phase
                    extrinsic.method.section === 'proxy' &&
                    extrinsic.method.method === 'proxy').map(([index]) => index);
                if (proxyProxyExtrinsicIndexes.length > 0) {
                    // We know that proxy.proxy has some staking.payoutStakers extrinsic
                    // Then we need to do a lookup of the previous staking.payoutStarted
                    // event to get validator and era
                    const payoutStartedEvents = IndexedBlockEvents.filter(([, record]) => record.phase.isApplyExtrinsic &&
                        proxyProxyExtrinsicIndexes.includes(record.phase.asApplyExtrinsic.toNumber()) && // events should be related to proxy.proxy extrinsic
                        record.event.section === 'staking' &&
                        record.event.method === 'PayoutStarted').reverse();
                    if (payoutStartedEvents) {
                        const payoutStartedEvent = payoutStartedEvents.find(([index]) => index < eventIndex);
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
                era,
                new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10),
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
        }
        else {
            data = [
                blockNumber,
                eventIndex,
                event.data[0].toString(),
                new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10),
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
            logger.debug(loggerOptions, `Added staking reward #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
        }
        catch (error) {
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
    if (event.section === 'staking' &&
        (event.method === 'Slash' || event.method === 'Slashed')) {
        const data = [
            blockNumber,
            eventIndex,
            event.data[0].toString(),
            event.data[0].toString(),
            activeEra - 1,
            new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10),
            timestamp,
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
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding validator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
            Sentry.captureException(error);
        }
    }
    // Store nominator staking slash
    if (event.section === 'balances' &&
        (event.method === 'Slash' || event.method === 'Slashed')) {
        const validatorStashAddress = (0, exports.getSlashedValidatorAccount)(eventIndex, IndexedBlockEvents);
        const data = [
            blockNumber,
            eventIndex,
            event.data[0].toString(),
            validatorStashAddress,
            activeEra - 1,
            new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10),
            timestamp,
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
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding nominator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
            const scope = new Sentry.Scope();
            scope.setTag('blockNumber', blockNumber);
            Sentry.captureException(error, scope);
        }
    }
};
exports.processEvent = processEvent;
const processEvents = async (client, blockNumber, activeEra, blockEvents, blockExtrinsics, timestamp, loggerOptions) => {
    const startTime = new Date().getTime();
    const IndexedBlockEvents = blockEvents.map((event, index) => [index, event]);
    const IndexedBlockExtrinsics = blockExtrinsics.map((extrinsic, index) => [index, extrinsic]);
    const chunks = (0, utils_1.chunker)(IndexedBlockEvents, chunkSize);
    for (const chunk of chunks) {
        await Promise.all(chunk.map((indexedEvent) => (0, exports.processEvent)(client, blockNumber, activeEra, indexedEvent, IndexedBlockEvents, IndexedBlockExtrinsics, timestamp, loggerOptions)));
    }
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) /
        1000).toFixed(3)}s`);
};
exports.processEvents = processEvents;
const processLog = async (client, blockNumber, log, index, timestamp, loggerOptions) => {
    const { type } = log;
    // this can change in the future...
    const [[engine, logData]] = type === 'RuntimeEnvironmentUpdated'
        ? [[null, null]]
        : Object.values(log.toHuman());
    const data = [blockNumber, index, type, engine, logData, timestamp];
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
    }
    catch (error) {
        logger.error(loggerOptions, `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`);
        const scope = new Sentry.Scope();
        scope.setTag('blockNumber', blockNumber);
        Sentry.captureException(error, scope);
    }
};
exports.processLog = processLog;
const processLogs = async (client, blockNumber, logs, timestamp, loggerOptions) => {
    const startTime = new Date().getTime();
    await Promise.all(logs.map((log, index) => (0, exports.processLog)(client, blockNumber, log, index, timestamp, loggerOptions)));
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};
exports.processLogs = processLogs;
const getDisplayName = (identity) => {
    if (identity.displayParent &&
        identity.displayParent !== '' &&
        identity.display &&
        identity.display !== '') {
        return `${identity.displayParent} / ${identity.display}`;
    }
    return identity.display || '';
};
exports.getDisplayName = getDisplayName;
const updateFinalized = async (client, finalizedBlock, loggerOptions) => {
    const sql = `
    UPDATE block SET finalized = true WHERE finalized = false AND block_number <= $1;
  `;
    try {
        await client.query(sql, [finalizedBlock]);
    }
    catch (error) {
        logger.error(loggerOptions, `Error updating finalized blocks: ${error}`);
        Sentry.captureException(error);
    }
};
exports.updateFinalized = updateFinalized;
const logHarvestError = async (client, blockNumber, error, loggerOptions) => {
    const timestamp = new Date().getTime();
    const errorString = error.toString().replace(/'/g, "''");
    const data = [blockNumber, errorString, timestamp];
    const query = `
    INSERT INTO
      harvest_error (block_number, error, timestamp)
    VALUES
      ($1, $2, $3)
    ON CONFLICT ON CONSTRAINT
      harvest_error_pkey 
      DO NOTHING
    ;`;
    await (0, exports.dbParamQuery)(client, query, data, loggerOptions);
};
exports.logHarvestError = logHarvestError;
const healthCheck = async (config, client, loggerOptions) => {
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
    const res = await (0, exports.dbQuery)(client, query, loggerOptions);
    for (const row of res.rows) {
        logger.info(loggerOptions, `Health check failed for block #${row.block_number}, deleting block from block table!`);
        await (0, exports.dbQuery)(client, `DELETE FROM block WHERE block_number = '${row.block_number}';`, loggerOptions);
    }
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Health check finished in ${((endTime - startTime) / 1000).toFixed(config.statsPrecision)}s`);
};
exports.healthCheck = healthCheck;
const storeMetadata = async (client, blockNumber, blockHash, specName, specVersion, timestamp, loggerOptions) => {
    let metadata;
    try {
        const response = await axios_1.default.get(`${backend_config_1.backendConfig.substrateApiSidecar}/runtime/metadata?at=${blockHash}`);
        metadata = response.data;
        logger.debug(loggerOptions, `Got runtime metadata at ${blockHash}!`);
    }
    catch (error) {
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
    await (0, exports.dbParamQuery)(client, query, data, loggerOptions);
};
exports.storeMetadata = storeMetadata;
const harvestBlock = async (config, api, client, blockNumber, loggerOptions) => {
    const startTime = new Date().getTime();
    try {
        const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
        const apiAt = await api.at(blockHash);
        const [{ block }, blockEvents, blockHeader, totalIssuance, runtimeVersion, activeEra, currentIndex, chainElectionStatus, timestamp,] = await Promise.all([
            api.rpc.chain.getBlock(blockHash),
            apiAt.query.system.events(),
            api.derive.chain.getHeader(blockHash),
            apiAt.query.balances.totalIssuance(),
            api.rpc.state.getRuntimeVersion(blockHash),
            apiAt.query.staking
                .activeEra()
                .then((res) => (res.toJSON() ? res.toJSON().index : 0))
                .catch((e) => {
                console.log(e);
                return 0;
            }),
            apiAt.query.session.currentIndex().then((res) => res || 0),
            apiAt.query.electionProviderMultiPhase.currentPhase(),
            apiAt.query.timestamp.now(),
        ]);
        const blockAuthor = blockHeader.author || '';
        const blockAuthorIdentity = await api.derive.accounts.info(blockHeader.author);
        const blockAuthorName = (0, exports.getDisplayName)(blockAuthorIdentity.identity);
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
            timestamp,
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
            await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
            const endTime = new Date().getTime();
            logger.debug(loggerOptions, `Added block #${blockNumber} (${(0, utils_1.shortHash)(blockHash.toString())}) in ${((endTime - startTime) /
                1000).toFixed(config.statsPrecision)}s`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
            const scope = new Sentry.Scope();
            scope.setTag('blockNumber', blockNumber);
            Sentry.captureException(error, scope);
        }
        // Runtime upgrade
        const runtimeUpgrade = blockEvents.find(({ event }) => apiAt.events.system.CodeUpdated.is(event));
        if (runtimeUpgrade) {
            const specName = runtimeVersion.toJSON().specName;
            const specVersion = runtimeVersion.specVersion;
            // TODO: enable again
            // see: https://github.com/polkadot-js/api/issues/4596
            // const metadata = await api.rpc.state.getMetadata(blockHash);
            await (0, exports.storeMetadata)(client, blockNumber, blockHash.toString(), specName.toString(), specVersion.toNumber(), timestamp.toNumber(), loggerOptions);
        }
        await Promise.all([
            // Store block extrinsics
            (0, exports.processExtrinsics)(api, apiAt, client, blockNumber, blockHash, block.extrinsics, blockEvents, timestamp.toNumber(), loggerOptions),
            // Store module events
            (0, exports.processEvents)(client, blockNumber, parseInt(activeEra.toString()), blockEvents, block.extrinsics, timestamp.toNumber(), loggerOptions),
            // Store block logs
            (0, exports.processLogs)(client, blockNumber, blockHeader.digest.logs, timestamp.toNumber(), loggerOptions),
        ]);
    }
    catch (error) {
        logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
        await (0, exports.logHarvestError)(client, blockNumber, error, loggerOptions);
        const scope = new Sentry.Scope();
        scope.setTag('blockNumber', blockNumber);
        Sentry.captureException(error, scope);
    }
};
exports.harvestBlock = harvestBlock;
// eslint-disable-next-line no-unused-vars
const harvestBlocksSeq = async (config, api, client, startBlock, endBlock, loggerOptions) => {
    const reverseOrder = true;
    const blocks = reverseOrder
        ? (0, utils_1.reverseRange)(startBlock, endBlock, 1)
        : (0, utils_1.range)(startBlock, endBlock, 1);
    const blockProcessingTimes = [];
    let maxTimeMs = 0;
    let minTimeMs = 1000000;
    let avgTimeMs = 0;
    for (const blockNumber of blocks) {
        const blockStartTime = Date.now();
        await (0, exports.harvestBlock)(config, api, client, blockNumber, loggerOptions);
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
        avgTimeMs =
            blockProcessingTimes.reduce((sum, blockProcessingTime) => sum + blockProcessingTime, 0) / blockProcessingTimes.length;
        const completed = ((blocks.indexOf(blockNumber) + 1) * 100) / blocks.length;
        logger.info(loggerOptions, `Processed block #${blockNumber} ${blocks.indexOf(blockNumber) + 1}/${blocks.length} [${completed.toFixed(config.statsPrecision)}%] in ${(blockProcessingTimeMs / 1000).toFixed(config.statsPrecision)}s min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)}`);
    }
};
exports.harvestBlocksSeq = harvestBlocksSeq;
const harvestBlocks = async (config, api, client, startBlock, endBlock, loggerOptions) => {
    const reverseOrder = true;
    const blocks = reverseOrder
        ? (0, utils_1.reverseRange)(startBlock, endBlock, 1)
        : (0, utils_1.range)(startBlock, endBlock, 1);
    const chunks = (0, utils_1.chunker)(blocks, config.chunkSize);
    logger.info(loggerOptions, `Processing chunks of ${config.chunkSize} blocks`);
    const chunkProcessingTimes = [];
    let maxTimeMs = 0;
    let minTimeMs = 1000000;
    let avgTimeMs = 0;
    let avgBlocksPerSecond = 0;
    for (const chunk of chunks) {
        const chunkStartTime = Date.now();
        await Promise.all(chunk.map((blockNumber) => (0, exports.harvestBlock)(config, api, client, blockNumber, loggerOptions)));
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
        avgTimeMs =
            chunkProcessingTimes.reduce((sum, chunkProcessingTime) => sum + chunkProcessingTime, 0) / chunkProcessingTimes.length;
        avgBlocksPerSecond = 1 / (avgTimeMs / 1000 / config.chunkSize);
        const currentBlocksPerSecond = 1 / (chunkProcessingTimeMs / 1000 / config.chunkSize);
        const completed = ((chunks.indexOf(chunk) + 1) * 100) / chunks.length;
        logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} [${completed.toFixed(config.statsPrecision)}%] ` +
            `in ${(chunkProcessingTimeMs / 1000).toFixed(config.statsPrecision)}s ` +
            `min/max/avg: ${(minTimeMs / 1000).toFixed(config.statsPrecision)}/${(maxTimeMs / 1000).toFixed(config.statsPrecision)}/${(avgTimeMs / 1000).toFixed(config.statsPrecision)} ` +
            `cur/avg bps: ${currentBlocksPerSecond.toFixed(config.statsPrecision)}/${avgBlocksPerSecond.toFixed(config.statsPrecision)}`);
    }
};
exports.harvestBlocks = harvestBlocks;
const getAccountIdFromArgs = (account) => account.map(({ args }) => args).map(([e]) => e.toHuman());
exports.getAccountIdFromArgs = getAccountIdFromArgs;
const fetchAccountIds = async (api) => (0, exports.getAccountIdFromArgs)(await api.query.system.account.keys());
exports.fetchAccountIds = fetchAccountIds;
const processAccountsChunk = async (api, client, accountId, loggerOptions) => {
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
    await (0, exports.dbParamQuery)(client, query, data, loggerOptions);
};
exports.processAccountsChunk = processAccountsChunk;
//
// staking
//
const getThousandValidators = async (loggerOptions) => {
    try {
        const response = await axios_1.default.get('https://kusama.w3f.community/candidates');
        return response.data;
    }
    catch (error) {
        logger.error(loggerOptions, `Error fetching Thousand Validator Program stats: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
        return [];
    }
};
exports.getThousandValidators = getThousandValidators;
const isVerifiedIdentity = (identity) => {
    if (identity.judgements.length === 0) {
        return false;
    }
    return identity.judgements
        .filter(([, judgement]) => !judgement.isFeePaid)
        .some(([, judgement]) => judgement.isKnownGood || judgement.isReasonable);
};
exports.isVerifiedIdentity = isVerifiedIdentity;
const getName = (identity) => {
    if (identity.displayParent &&
        identity.displayParent !== '' &&
        identity.display &&
        identity.display !== '') {
        return `${identity.displayParent}/${identity.display}`;
    }
    return identity.display || '';
};
exports.getName = getName;
const getClusterName = (identity) => identity.displayParent || '';
exports.getClusterName = getClusterName;
const subIdentity = (identity) => {
    if (identity.displayParent &&
        identity.displayParent !== '' &&
        identity.display &&
        identity.display !== '') {
        return true;
    }
    return false;
};
exports.subIdentity = subIdentity;
const getIdentityRating = (name, verifiedIdentity, hasAllFields) => {
    if (verifiedIdentity && hasAllFields) {
        return 3;
    }
    if (verifiedIdentity && !hasAllFields) {
        return 2;
    }
    if (name !== '') {
        return 1;
    }
    return 0;
};
exports.getIdentityRating = getIdentityRating;
const parseIdentity = (identity) => {
    const verifiedIdentity = (0, exports.isVerifiedIdentity)(identity);
    const hasSubIdentity = (0, exports.subIdentity)(identity);
    const name = (0, exports.getName)(identity);
    const hasAllFields = (identity === null || identity === void 0 ? void 0 : identity.display) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.legal) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.web) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.email) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.twitter) !== undefined &&
        (identity === null || identity === void 0 ? void 0 : identity.riot) !== undefined;
    const identityRating = (0, exports.getIdentityRating)(name, verifiedIdentity, hasAllFields);
    return {
        verifiedIdentity,
        hasSubIdentity,
        name,
        identityRating,
    };
};
exports.parseIdentity = parseIdentity;
const getCommissionHistory = (accountId, erasPreferences) => {
    const commissionHistory = [];
    erasPreferences.forEach(({ era, validators }) => {
        if (validators[accountId]) {
            commissionHistory.push({
                era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                commission: (validators[accountId].commission / 10000000).toFixed(2),
            });
        }
        else {
            commissionHistory.push({
                era: new bignumber_js_1.BigNumber(era.toString()).toString(10),
                commission: null,
            });
        }
    });
    return commissionHistory;
};
exports.getCommissionHistory = getCommissionHistory;
const getCommissionRating = (commission, commissionHistory) => {
    if (commission !== 100 && commission !== 0) {
        if (commission > 10) {
            return 1;
        }
        if (commission >= 5) {
            if (commissionHistory.length > 1 &&
                commissionHistory[0] > commissionHistory[commissionHistory.length - 1]) {
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
exports.getCommissionRating = getCommissionRating;
const getPayoutRating = (config, payoutHistory) => {
    const pendingEras = payoutHistory.filter((era) => era.status === 'pending').length;
    if (pendingEras <= config.erasPerDay) {
        return 3;
    }
    if (pendingEras <= 3 * config.erasPerDay) {
        return 2;
    }
    if (pendingEras < 7 * config.erasPerDay) {
        return 1;
    }
    return 0;
};
exports.getPayoutRating = getPayoutRating;
const getClusterInfo = (hasSubIdentity, validators, validatorIdentity) => {
    if (!hasSubIdentity) {
        // string detection
        // samples: DISC-SOFT-01, BINANCE_KSM_9, SNZclient-1
        if (validatorIdentity.display) {
            const stringSize = 6;
            const clusterMembers = validators.filter(({ identity }) => (identity.display || '').substring(0, stringSize) ===
                validatorIdentity.display.substring(0, stringSize)).length;
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
    const clusterMembers = validators.filter(({ identity }) => identity.displayParent === validatorIdentity.displayParent).length;
    const clusterName = (0, exports.getClusterName)(validatorIdentity);
    return {
        clusterName,
        clusterMembers,
    };
};
exports.getClusterInfo = getClusterInfo;
//
//   featured rules:
//
// - maximum commission is 10%
// - at least 20 KSM own stake
// - no previously featured
//
const addNewFeaturedValidator = async (config, client, ranking, loggerOptions) => {
    // get previously featured
    const alreadyFeatured = [];
    const sql = 'SELECT stash_address, timestamp FROM featured';
    const res = await (0, exports.dbQuery)(client, sql, loggerOptions);
    res.rows.forEach((validator) => alreadyFeatured.push(validator.stash_address));
    // get candidates that meet the rules
    const featuredCandidates = ranking
        .filter((validator) => validator.commission <= 10 &&
        validator.selfStake.div(10 ** config.tokenDecimals).gte(20) &&
        !validator.active &&
        !alreadyFeatured.includes(validator.stashAddress))
        .map(({ rank }) => rank);
    // get random featured validator of the week
    const shuffled = [...featuredCandidates].sort(() => 0.5 - Math.random());
    const randomRank = shuffled[0];
    const featured = ranking.find((validator) => validator.rank === randomRank);
    await (0, exports.dbQuery)(client, `INSERT INTO featured (stash_address, name, timestamp) VALUES ('${featured.stashAddress}', '${featured.name}', '${new Date().getTime()}')`, loggerOptions);
    logger.debug(loggerOptions, `New featured validator added: ${featured.name} ${featured.stashAddress}`);
};
exports.addNewFeaturedValidator = addNewFeaturedValidator;
const insertRankingValidator = async (client, validator, blockHeight, startTime, loggerOptions) => {
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
    await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
};
exports.insertRankingValidator = insertRankingValidator;
const insertEraValidatorStats = async (client, validator, activeEra, loggerOptions) => {
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
    let data = [validator.stashAddress, activeEra, validator.totalRating];
    await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
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
            await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
    for (const perfHistoryItem of validator.relativePerformanceHistory) {
        if (perfHistoryItem.relativePerformance &&
            perfHistoryItem.relativePerformance > 0) {
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
            await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
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
            await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
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
            await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
};
exports.insertEraValidatorStats = insertEraValidatorStats;
const getAddressCreation = async (client, address, loggerOptions) => {
    const query = "SELECT block_number FROM event WHERE method = 'NewAccount' AND data LIKE $1";
    const res = await (0, exports.dbParamQuery)(client, query, [`%${address}%`], loggerOptions);
    if (res) {
        if (res.rows.length > 0) {
            if (res.rows[0].block_number) {
                return res.rows[0].block_number;
            }
        }
    }
    // if not found we assume it was created in genesis block
    return 0;
};
exports.getAddressCreation = getAddressCreation;
const getLastEraInDb = async (client, loggerOptions) => {
    // TODO: check also:
    // era_points_avg, era_relative_performance_avg, era_self_stake_avg
    const query = 'SELECT era FROM era_commission_avg ORDER BY era DESC LIMIT 1';
    const res = await (0, exports.dbQuery)(client, query, loggerOptions);
    if (res) {
        if (res.rows.length > 0) {
            if (res.rows[0].era) {
                return res.rows[0].era;
            }
        }
    }
    return '0';
};
exports.getLastEraInDb = getLastEraInDb;
const insertEraValidatorStatsAvg = async (client, eraIndex, loggerOptions) => {
    const era = new bignumber_js_1.BigNumber(eraIndex.toString()).toString(10);
    let data = [era];
    let sql = 'SELECT AVG(commission) AS commission_avg FROM era_commission WHERE era = $1 AND commission != 100';
    let res = await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
    if (res.rows.length > 0) {
        if (res.rows[0].commission_avg) {
            data = [era, res.rows[0].commission_avg];
            sql =
                'INSERT INTO era_commission_avg (era, commission_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_commission_avg_pkey DO NOTHING;';
            await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
    sql =
        'SELECT AVG(self_stake) AS self_stake_avg FROM era_self_stake WHERE era = $1';
    data = [era];
    res = await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
    if (res.rows.length > 0) {
        if (res.rows[0].self_stake_avg) {
            const selfStakeAvg = res.rows[0].self_stake_avg
                .toString(10)
                .split('.')[0];
            data = [era, selfStakeAvg];
            sql =
                'INSERT INTO era_self_stake_avg (era, self_stake_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_self_stake_avg_pkey DO NOTHING;';
            await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
    sql =
        'SELECT AVG(relative_performance) AS relative_performance_avg FROM era_relative_performance WHERE era = $1';
    data = [era];
    res = await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
    if (res.rows.length > 0) {
        if (res.rows[0].relative_performance_avg) {
            data = [era, res.rows[0].relative_performance_avg];
            sql =
                'INSERT INTO era_relative_performance_avg (era, relative_performance_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_relative_performance_avg_pkey DO NOTHING;';
            await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
    sql = 'SELECT AVG(points) AS points_avg FROM era_points WHERE era = $1';
    data = [era];
    res = await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
    if (res.rows.length > 0) {
        if (res.rows[0].points_avg) {
            data = [era, res.rows[0].points_avg];
            sql =
                'INSERT INTO era_points_avg (era, points_avg) VALUES ($1, $2) ON CONFLICT ON CONSTRAINT era_points_avg_pkey DO NOTHING;';
            await (0, exports.dbParamQuery)(client, sql, data, loggerOptions);
        }
    }
};
exports.insertEraValidatorStatsAvg = insertEraValidatorStatsAvg;

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
exports.getTransferAllAmount = exports.chunker = exports.logHarvestError = exports.updateFinalized = exports.updateTotalEvents = exports.updateTotalTransfers = exports.updateTotalExtrinsics = exports.updateTotalBlocks = exports.updateTotals = exports.getDisplayName = exports.getExtrinsicSuccessOrErrorMessage = exports.processLog = exports.processLogs = exports.processEvent = exports.processEvents = exports.processExtrinsic = exports.processExtrinsics = exports.updateAccountInfo = exports.updateAccountsInfo = exports.isValidAddressPolkadotAddress = exports.dbParamQuery = exports.dbQuery = exports.getClient = exports.wait = exports.shortHash = exports.formatNumber = exports.isNodeSynced = exports.getPolkadotAPI = void 0;
// @ts-check
require("@polkadot/api-augment");
const pino_1 = __importDefault(require("pino"));
const api_1 = require("@polkadot/api");
const keyring_1 = require("@polkadot/keyring");
const util_1 = require("@polkadot/util");
const pg_1 = require("pg");
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = __importDefault(require("fs"));
const backend_config_1 = require("../backend.config");
const bignumber_js_1 = require("bignumber.js");
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
    const indexedExtrinsics = extrinsics.map((extrinsic, index) => ([index, extrinsic]));
    const chunks = module.exports.chunker(indexedExtrinsics, chunkSize);
    for (const chunk of chunks) {
        yield Promise.all(chunk.map((indexedExtrinsic) => module.exports.processExtrinsic(api, client, blockNumber, blockHash, indexedExtrinsic, blockEvents, timestamp, loggerOptions)));
    }
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
});
exports.processExtrinsics = processExtrinsics;
const processExtrinsic = (api, client, blockNumber, blockHash, indexedExtrinsic, blockEvents, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const [index, extrinsic] = indexedExtrinsic;
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
        yield client.query(sql);
        logger.debug(loggerOptions, `Added extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
    }
    catch (error) {
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
            yield client.query(sql);
            logger.debug(loggerOptions, `Added signed extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
        }
        catch (error) {
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
                amount = (0, exports.getTransferAllAmount)(index, blockEvents);
            }
            else if (method === 'forceTransfer') {
                amount = JSON.parse(args)[2];
            }
            else {
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
                logger.debug(loggerOptions, `Added transfer ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
            }
            catch (error) {
                logger.error(loggerOptions, `Error adding transfer ${blockNumber}-${index}: ${JSON.stringify(error)}`);
            }
        }
    }
});
exports.processExtrinsic = processExtrinsic;
const processEvents = (client, blockNumber, blockEvents, blockExtrinsics, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = new Date().getTime();
    const indexedBlockEvents = blockEvents.map((event, index) => ([index, event]));
    const chunks = module.exports.chunker(indexedBlockEvents, chunkSize);
    for (const chunk of chunks) {
        yield Promise.all(chunk.map((indexedEvent) => module.exports.processEvent(client, blockNumber, indexedEvent, blockEvents, blockExtrinsics, timestamp, loggerOptions)));
    }
    // Log execution time
    const endTime = new Date().getTime();
    logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) / 1000).toFixed(3)}s`);
});
exports.processEvents = processEvents;
const processEvent = (client, blockNumber, indexedEvent, blockEvents, blockExtrinsics, timestamp, loggerOptions) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    // Store staking reward
    if (event.section === 'staking' && (event.method === 'Reward' || event.method === 'Rewarded')) {
        // Store validator stash address and era index
        console.log('DEBUG BLOCK:', blockNumber);
        // console.log('DEBUG EXTRINSICS:', JSON.stringify(blockExtrinsics.toHuman(), null, 2));
        //
        //   Possible cases guessing era and validator:
        //
        // -> staking.payoutStakers - https://polkadot.js.org/docs/substrate/extrinsics/#payoutstakersvalidator_stash-accountid32-era-u32
        //
        //   Example args: ["E2mSyopQTSUosTtZSUZrn4VbrJtCYW8RxqxAUvdk2oxRBGn","0x00000951"]
        //
        // - staking.payoutValidator (DEPRECATED, NOT SUPPORTED)
        //
        //   Example args: ["0x00000289"]
        //
        // [ Make one validator's payout for one era., ,  - `who` is the controller account of the validator 
        // to pay out.,  - `era` may not be lower than one following the most recently paid era. If it is higher,,    
        // then it indicates an instruction to skip the payout of all previous eras., ,  WARNING: once an era 
        // is payed for a validator such validator can't claim the payout of,  previous era., ,  
        // WARNING: Incorrect arguments here can result in loss of payout. Be very careful., ,  # <weight>,  
        // - Time complexity: O(1).,  - Contains a limited number of reads and writes.,  # </weight>]
        //
        // -> staking.payoutNominator (DEPRECATED, NOT SUPPORTED)
        //
        //   Example args: ["0x000002fd",[["FFdDXFK1VKG5QgjvqwxdVjo8hGrBveaBFfHnWyz1MAmLL82",7]]]
        //
        // [ **This extrinsic will be removed after `MigrationEra + HistoryDepth` has passed, giving,  opportunity for users to 
        // claim all rewards before moving to Simple Payouts. After this,  time, you should use `payout_stakers` instead.**, ,  
        // Make one nominator's payout for one era., ,  - `who` is the controller account of the nominator to pay out.,  - `era` may 
        // not be lower than one following the most recently paid era. If it is higher,,    then it indicates an instruction to skip 
        // the payout of all previous eras.,  - `validators` is the list of all validators that `who` had exposure to during `era`,,    
        // alongside the index of `who` in the clipped exposure of the validator.,    I.e. each element is a tuple of,    
        // `(validator, index of `who` in clipped exposure of validator)`.,    If it is incomplete, then less than the full reward 
        // will be paid out.,    It must not exceed `MAX_NOMINATIONS`., ,  WARNING: once an era is payed for a validator such validator 
        // can't claim the payout of,  previous era., ,  WARNING: Incorrect arguments here can result in loss of payout. Be very careful., 
        // ,  # <weight>,  - Number of storage read of `O(validators)`; `validators` is the argument of the call,,    and is bounded 
        // by `MAX_NOMINATIONS`.,  - Each storage read is `O(N)` size and decode complexity; `N` is the  maximum,    nominations that 
        // can be given to a single validator.,  - Computation complexity: `O(MAX_NOMINATIONS * logN)`; `MAX_NOMINATIONS` is the,    
        // maximum number of validators that may be nominated by a single nominator, it is,    bounded only economically 
        // (all nominators are required to place a minimum stake).,  # </weight>]
        //
        // -> staking.payoutStakers, staking.payoutValidator or staking.payoutNominator included in a utility.batch or utility.batchAll extrinsic
        //
        // -> staking.payoutStakers included in a proxy.proxy extrinsic
        //
        let validator = null;
        let era = null;
        const payoutStakersExtrinsic = blockExtrinsics
            .find(({ method: { section, method } }) => (phase.asApplyExtrinsic.eq(eventIndex) // event phase
            && section === 'staking'
            && method === 'payoutStakers'));
        if (payoutStakersExtrinsic) {
            validator = payoutStakersExtrinsic.method.args[0];
            era = payoutStakersExtrinsic.method.args[1];
        }
        else {
            // Block: 11253017
            // utility.batch
            // Args example: [[{"callIndex":"0x0612","args":{"validator_stash":"FcjmeNzPk3vgdENm1rHeiMCxFK96beUoi2kb59FmCoZtkGF","era":3307}},{"callIndex":"0x0612","args":{"validator_stash":"FcjmeNzPk3vgdENm1rHeiMCxFK96beUoi2kb59FmCoZtkGF","era":3308}},{"callIndex":"0x0612","args":{"validator_stash":"FcjmeNzPk3vgdENm1rHeiMCxFK96beUoi2kb59FmCoZtkGF","era":3309}},{"callIndex":"0x0612","args":{"validator_stash":"FcjmeNzPk3vgdENm1rHeiMCxFK96beUoi2kb59FmCoZtkGF","era":3310}},{"callIndex":"0x0612","args":{"validator_stash":"Dm64aaAUyy5dvYCSmyzz3njGrWrVaki9F6BvUDSYjDDoqR2","era":3307}},{"callIndex":"0x0612","args":{"validator_stash":"Dm64aaAUyy5dvYCSmyzz3njGrWrVaki9F6BvUDSYjDDoqR2","era":3308}}]]
            const utilityBatchExtrinsic = blockExtrinsics
                .find(({ method: { section, method } }) => (phase.asApplyExtrinsic.eq(eventIndex) // event phase
                && section === 'utility'
                && method === 'batch'));
            if (utilityBatchExtrinsic) {
                // We know that utility.batch has some staking.payoutStakers extrinsic
                // Then we need to do a lookup of the previous staking.payoutStarted event
                const payoutStartedEvent = blockEvents.find((record, index) => (index < eventIndex
                    && record.event.section === 'staking'
                    && record.event.method === 'payoutStarted'));
                validator = payoutStartedEvent.event.data[0];
                era = payoutStartedEvent.event.data[1];
            }
            // TODO: support staking.payoutStakers extrinsic included in a proxy.proxy extrinsic
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
      '${eventIndex}',
      '${event.data[0]}',
      '${new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10)}',
      '${timestamp}'
    )
    ON CONFLICT ON CONSTRAINT staking_slash_pkey 
    DO NOTHING
    ;`;
        try {
            yield client.query(sql);
            logger.debug(loggerOptions, `Added staking slash #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
        }
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
const chunker = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
exports.chunker = chunker;
const getTransferAllAmount = (index, blockEvents) => JSON.stringify(blockEvents
    .find(({ event, phase }) => {
    var _a, _b;
    return ((((_a = phase.toJSON()) === null || _a === void 0 ? void 0 : _a.ApplyExtrinsic) === index || ((_b = phase.toJSON()) === null || _b === void 0 ? void 0 : _b.applyExtrinsic) === index)
        && event.section === 'balances'
        && event.method === 'Transfer');
}).event.data.toJSON()[2] || '');
exports.getTransferAllAmount = getTransferAllAmount;

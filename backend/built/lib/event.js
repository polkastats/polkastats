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
Object.defineProperty(exports, "__esModule", { value: true });
exports.processEvents = exports.processEvent = exports.getSlashedValidatorAccount = void 0;
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const bignumber_js_1 = require("bignumber.js");
const utils_1 = require("./utils");
const backend_config_1 = require("../backend.config");
const logger_1 = require("./logger");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
// Used for processing events and extrinsics
const chunkSize = 100;
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
        logger_1.logger.debug(loggerOptions, `Added event #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error adding event #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
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
                era.toString(),
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
            logger_1.logger.debug(loggerOptions, `Added staking reward #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
        }
        catch (error) {
            logger_1.logger.error(loggerOptions, `Error adding staking reward #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
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
        data = [
            blockNumber,
            eventIndex,
            event.data[0].toString(),
            event.data[0].toString(),
            activeEra - 1,
            new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10),
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
            logger_1.logger.debug(loggerOptions, `Added validator staking slash #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
        }
        catch (error) {
            logger_1.logger.error(loggerOptions, `Error adding validator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
            Sentry.captureException(error);
        }
    }
    // Store nominator staking slash
    if (event.section === 'balances' &&
        (event.method === 'Slash' || event.method === 'Slashed')) {
        const validatorStashAddress = (0, exports.getSlashedValidatorAccount)(eventIndex, IndexedBlockEvents);
        data = [
            blockNumber,
            eventIndex,
            event.data[0].toString(),
            validatorStashAddress,
            activeEra - 1,
            new bignumber_js_1.BigNumber(event.data[1].toString()).toString(10),
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
            logger_1.logger.debug(loggerOptions, `Added nominator staking slash #${blockNumber}-${eventIndex} ${event.section} ➡ ${event.method}`);
        }
        catch (error) {
            logger_1.logger.error(loggerOptions, `Error adding nominator staking slash #${blockNumber}-${eventIndex}: ${error}, sql: ${sql}`);
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
    logger_1.logger.debug(loggerOptions, `Added ${blockEvents.length} events in ${((endTime - startTime) /
        1000).toFixed(3)}s`);
};
exports.processEvents = processEvents;

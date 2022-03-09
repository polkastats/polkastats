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
exports.processExtrinsics = exports.processExtrinsic = exports.processTransfer = exports.getTransferAllAmount = exports.getExtrinsicSuccessOrErrorMessage = void 0;
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
    let destination = '';
    if (JSON.parse(args)[0].id) {
        destination = JSON.parse(args)[0].id;
    }
    else if (JSON.parse(args)[0].address20) {
        destination = JSON.parse(args)[0].address20;
    }
    else {
        destination = JSON.parse(args)[0];
    }
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
        logger_1.logger.debug(loggerOptions, `Added transfer ${blockNumber}-${extrinsicIndex} (${(0, utils_1.shortHash)(hash.toString())}) ${section} ➡ ${method}`);
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error adding transfer ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
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
    const args = JSON.stringify(extrinsic.method.args);
    const argsDef = JSON.stringify(extrinsic.argsDef);
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
                .then((result) => JSON.stringify(result.toJSON()) || '')
                .catch((error) => logger_1.logger.debug(loggerOptions, `API Error: ${error}`)),
            api.rpc.payment
                .queryFeeDetails(extrinsic.toHex(), blockHash)
                .then((result) => JSON.stringify(result.toJSON()) || '')
                .catch((error) => logger_1.logger.debug(loggerOptions, `API Error: ${error}`)),
        ]);
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
        logger_1.logger.debug(loggerOptions, `Added extrinsic ${blockNumber}-${extrinsicIndex} (${(0, utils_1.shortHash)(hash)}) ${section} ➡ ${method}`);
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
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
            logger_1.logger.debug(loggerOptions, `Added signed extrinsic ${blockNumber}-${extrinsicIndex} (${(0, utils_1.shortHash)(hash)}) ${section} ➡ ${method}`);
        }
        catch (error) {
            logger_1.logger.error(loggerOptions, `Error adding signed extrinsic ${blockNumber}-${extrinsicIndex}: ${JSON.stringify(error)}`);
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
    logger_1.logger.debug(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) /
        1000).toFixed(3)}s`);
};
exports.processExtrinsics = processExtrinsics;

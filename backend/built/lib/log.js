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
exports.processLogs = exports.processLog = void 0;
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const backend_config_1 = require("../backend.config");
const logger_1 = require("./logger");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
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
        logger_1.logger.debug(loggerOptions, `Added log ${blockNumber}-${index}`);
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error adding log ${blockNumber}-${index}: ${JSON.stringify(error)}`);
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
    logger_1.logger.debug(loggerOptions, `Added ${logs.length} logs in ${((endTime - startTime) / 1000).toFixed(3)}s`);
};
exports.processLogs = processLogs;

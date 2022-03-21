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
exports.dbParamQuery = exports.dbQuery = exports.getClient = void 0;
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const pg_1 = require("pg");
const backend_config_1 = require("../backend.config");
const logger_1 = require("./logger");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const getClient = async (loggerOptions) => {
    logger_1.logger.debug(loggerOptions, `Connecting to DB ${backend_config_1.backendConfig.postgresConnParams.database} at ${backend_config_1.backendConfig.postgresConnParams.host}:${backend_config_1.backendConfig.postgresConnParams.port}`);
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
        logger_1.logger.error(loggerOptions, `SQL: ${sql} ERROR: ${JSON.stringify(error)}`);
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
        logger_1.logger.error(loggerOptions, `SQL: ${sql} PARAM: ${JSON.stringify(data)} ERROR: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    }
    return null;
};
exports.dbParamQuery = dbParamQuery;

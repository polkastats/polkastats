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
exports.isNodeSynced = exports.getPolkadotAPI = void 0;
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
require("@polkadot/api-augment");
const api_1 = require("@polkadot/api");
const fs_1 = __importDefault(require("fs"));
const backend_config_1 = require("../backend.config");
const logger_1 = require("./logger");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const getPolkadotAPI = async (loggerOptions, apiCustomTypes) => {
    let api;
    logger_1.logger.debug(loggerOptions, `Connecting to ${backend_config_1.backendConfig.wsProviderUrl}`);
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
        logger_1.logger.error(loggerOptions, "Can't query node status");
        Sentry.captureException(error);
    }
    if (node && node.isSyncing.eq(false)) {
        logger_1.logger.debug(loggerOptions, 'Node is synced!');
        return true;
    }
    logger_1.logger.debug(loggerOptions, 'Node is NOT synced!');
    return false;
};
exports.isNodeSynced = isNodeSynced;

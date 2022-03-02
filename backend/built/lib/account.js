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
exports.updateAccountsInfo = exports.updateAccountInfo = exports.processAccountsChunk = exports.fetchAccountIds = exports.getAccountIdFromArgs = void 0;
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const lodash_1 = __importDefault(require("lodash"));
const db_1 = require("./db");
const logger_1 = require("./logger");
const backend_config_1 = require("../backend.config");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
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
    const reservedBalance = balances.reservedBalance.toString();
    const totalBalance = balances.freeBalance.add(balances.reservedBalance).toString();
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
        reservedBalance,
        totalBalance,
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
      reserved_balance,
      total_balance,
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
      $11,
      $12,
      $13
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
      reserved_balance = EXCLUDED.reserved_balance,
      total_balance = EXCLUDED.total_balance,
      nonce = EXCLUDED.nonce,
      timestamp = EXCLUDED.timestamp,
      block_height = EXCLUDED.block_height
    WHERE EXCLUDED.block_height > account.block_height
  ;`;
    await (0, db_1.dbParamQuery)(client, query, data, loggerOptions);
};
exports.processAccountsChunk = processAccountsChunk;
const updateAccountInfo = async (api, client, blockNumber, timestamp, address, loggerOptions) => {
    const [balances, { identity }] = await Promise.all([
        api.derive.balances.all(address),
        api.derive.accounts.info(address),
    ]);
    const accountId = balances.accountId.toHuman(); // ImOnline.HeartbeatReceived events return public key addresses but we want SS58 encoded address
    const availableBalance = balances.availableBalance.toString();
    const freeBalance = balances.freeBalance.toString();
    const lockedBalance = balances.lockedBalance.toString();
    const reservedBalance = balances.reservedBalance.toString();
    const totalBalance = balances.freeBalance.add(balances.reservedBalance).toString();
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
        reservedBalance,
        totalBalance,
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
      reserved_balance,
      total_balance,
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
      $11,
      $12,
      $13
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
      reserved_balance = EXCLUDED.reserved_balance,
      total_balance = EXCLUDED.total_balance,
      nonce = EXCLUDED.nonce,
      timestamp = EXCLUDED.timestamp,
      block_height = EXCLUDED.block_height
    WHERE EXCLUDED.block_height > account.block_height
  ;`;
    try {
        await client.query(query, data);
        logger_1.logger.debug(loggerOptions, `Updated account info for event/s involved address ${address}`);
    }
    catch (error) {
        logger_1.logger.error(loggerOptions, `Error updating account info for event/s involved address: ${JSON.stringify(error)}`);
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
    logger_1.logger.debug(loggerOptions, `Updated ${uniqueAddresses.length} accounts in ${((endTime - startTime) /
        1000).toFixed(3)}s`);
};
exports.updateAccountsInfo = updateAccountsInfo;

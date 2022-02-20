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
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
require("@polkadot/api-augment");
const pino_1 = __importDefault(require("pino"));
const utils_1 = require("../lib/utils");
const backend_config_1 = require("../backend.config");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const crawlerName = 'activeAccounts';
const logger = (0, pino_1.default)({
    level: backend_config_1.backendConfig.logLevel,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
const { chunkSize } = config;
const getAccountId = (account) => account
    .map((e) => e.args)
    .map(([e]) => e)
    .map((e) => e.toHuman());
const fetchAccountIds = (api) => __awaiter(void 0, void 0, void 0, function* () { return getAccountId(yield api.query.system.account.keys()); });
const chunker = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const processChunk = (api, client, accountId) => __awaiter(void 0, void 0, void 0, function* () {
    const timestamp = Math.floor(parseInt(Date.now().toString(), 10) / 1000);
    const [block, identity, balances] = yield Promise.all([
        api.rpc.chain.getBlock().then((result) => result.block.header.number.toNumber()),
        api.derive.accounts.identity(accountId),
        api.derive.balances.all(accountId),
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
    yield (0, utils_1.dbParamQuery)(client, query, data, loggerOptions);
});
const crawler = (delayedStart) => __awaiter(void 0, void 0, void 0, function* () {
    if (delayedStart && config.startDelay) {
        logger.debug(loggerOptions, `Delaying active accounts crawler start for ${config.startDelay / 1000}s`);
        yield (0, utils_1.wait)(config.startDelay);
    }
    logger.debug(loggerOptions, 'Running active accounts crawler...');
    const client = yield (0, utils_1.getClient)(loggerOptions);
    const api = yield (0, utils_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = yield (0, utils_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        yield (0, utils_1.wait)(10000);
        synced = yield (0, utils_1.isNodeSynced)(api, loggerOptions);
    }
    const startTime = new Date().getTime();
    const accountIds = yield fetchAccountIds(api);
    logger.info(loggerOptions, `Got ${accountIds.length} active accounts`);
    const chunks = chunker(accountIds, chunkSize);
    logger.info(loggerOptions, `Processing chunks of ${chunkSize} accounts`);
    for (const chunk of chunks) {
        const chunkStartTime = Date.now();
        yield Promise.all(chunk.map((accountId) => processChunk(api, client, accountId)));
        const chunkEndTime = new Date().getTime();
        logger.info(loggerOptions, `Processed chunk ${chunks.indexOf(chunk) + 1}/${chunks.length} in ${((chunkEndTime - chunkStartTime) / 1000).toFixed(3)}s`);
    }
    logger.debug(loggerOptions, 'Disconnecting from API');
    yield api.disconnect().catch((error) => {
        logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    });
    logger.debug(loggerOptions, 'Disconnecting from DB');
    yield client.end().catch((error) => {
        logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    });
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Processed ${accountIds.length} active accounts in ${((endTime - startTime) / 1000).toFixed(0)}s`);
    logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
    setTimeout(() => crawler(false), config.pollingTime);
});
crawler(true).catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    Sentry.captureException(error);
    process.exit(-1);
});

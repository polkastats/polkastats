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
const pino_1 = __importDefault(require("pino"));
const utils_1 = require("../lib/utils");
const backend_config_1 = require("../backend.config");
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const crawlerName = 'blockHarvester';
const logger = (0, pino_1.default)({
    level: backend_config_1.backendConfig.logLevel,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
const crawler = (delayedStart) => __awaiter(void 0, void 0, void 0, function* () {
    if (delayedStart) {
        logger.info(loggerOptions, `Delaying block harvester crawler start for ${config.startDelay / 1000}s`);
        yield (0, utils_1.wait)(config.startDelay);
    }
    logger.info(loggerOptions, 'Starting block harvester...');
    const startTime = new Date().getTime();
    const client = yield (0, utils_1.getClient)(loggerOptions);
    // Delete blocks that don't have all its events or extrinsics in db
    yield (0, utils_1.healthCheck)(config, client, loggerOptions);
    const api = yield (0, utils_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = yield (0, utils_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        yield (0, utils_1.wait)(10000);
        synced = yield (0, utils_1.isNodeSynced)(api, loggerOptions);
    }
    // Get gaps from block table
    // Thanks to @miguelmota: https://gist.github.com/miguelmota/6d40be2ecb083507de1d073443154610
    const sqlSelect = `
  SELECT
    gap_start, gap_end FROM (
      SELECT
        block_number + 1 AS gap_start,
        next_nr - 1 AS gap_end
      FROM (
        SELECT block_number, lead(block_number) OVER (ORDER BY block_number) AS next_nr
        FROM block
      ) nr
      WHERE nr.block_number + 1 <> nr.next_nr
  ) AS g UNION ALL (
    SELECT
      0 AS gap_start,
      block_number AS gap_end
    FROM
      block
    ORDER BY
      block_number ASC
    LIMIT 1
  )
  ORDER BY gap_start DESC
  `;
    const res = yield (0, utils_1.dbQuery)(client, sqlSelect, loggerOptions);
    for (const row of res.rows) {
        if (!(row.gap_start === 0 && row.gap_end === 0)) {
            logger.info(loggerOptions, `Detected gap! Harvesting blocks from #${row.gap_end} to #${row.gap_start}`);
            if (config.mode === 'chunks') {
                yield (0, utils_1.harvestBlocks)(config, api, client, parseInt(row.gap_start, 10), parseInt(row.gap_end, 10), loggerOptions);
            }
            else {
                yield (0, utils_1.harvestBlocksSeq)(config, api, client, parseInt(row.gap_start, 10), parseInt(row.gap_end, 10), loggerOptions);
            }
        }
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
    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Executed in ${((endTime - startTime) / 1000).toFixed(0)}s`);
    logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
    setTimeout(() => crawler(false), config.pollingTime);
});
crawler(true).catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    Sentry.captureException(error);
    process.exit(-1);
});

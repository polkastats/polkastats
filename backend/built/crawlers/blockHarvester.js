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
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const db_1 = require("../lib/db");
const chain_1 = require("../lib/chain");
const block_1 = require("../lib/block");
const utils_1 = require("../lib/utils");
const backend_config_1 = require("../backend.config");
const logger_1 = require("../lib/logger");
const crawlerName = 'blockHarvester';
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
const crawler = async (delayedStart) => {
    if (delayedStart) {
        logger_1.logger.info(loggerOptions, `Delaying block harvester crawler start for ${config.startDelay / 1000}s`);
        await (0, utils_1.wait)(config.startDelay);
    }
    logger_1.logger.info(loggerOptions, 'Starting block harvester...');
    const startTime = new Date().getTime();
    const client = await (0, db_1.getClient)(loggerOptions);
    // Delete blocks that don't have all its events or extrinsics in db
    await (0, block_1.healthCheck)(config, client, loggerOptions);
    const api = await (0, chain_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        await (0, utils_1.wait)(10000);
        synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
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
    const res = await (0, db_1.dbQuery)(client, sqlSelect, loggerOptions);
    for (const row of res.rows) {
        if (!(row.gap_start === 0 && row.gap_end === 0)) {
            logger_1.logger.info(loggerOptions, `Detected gap! Harvesting blocks from #${row.gap_end} to #${row.gap_start}`);
            if (config.mode === 'chunks') {
                await (0, block_1.harvestBlocks)(config, api, client, parseInt(row.gap_start, 10), parseInt(row.gap_end, 10), loggerOptions);
            }
            else {
                await (0, block_1.harvestBlocksSeq)(config, api, client, parseInt(row.gap_start, 10), parseInt(row.gap_end, 10), loggerOptions);
            }
        }
    }
    logger_1.logger.debug(loggerOptions, 'Disconnecting from API');
    await api.disconnect().catch((error) => {
        logger_1.logger.error(loggerOptions, `API disconnect error: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    });
    logger_1.logger.debug(loggerOptions, 'Disconnecting from DB');
    await client.end().catch((error) => {
        logger_1.logger.error(loggerOptions, `DB disconnect error: ${JSON.stringify(error)}`);
        Sentry.captureException(error);
    });
    // Log execution time
    const endTime = new Date().getTime();
    logger_1.logger.info(loggerOptions, `Executed in ${((endTime - startTime) / 1000).toFixed(0)}s`);
    logger_1.logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
    setTimeout(() => crawler(false), config.pollingTime);
};
crawler(true).catch((error) => {
    logger_1.logger.error(loggerOptions, `Crawler error: ${error}`);
    Sentry.captureException(error);
    process.exit(-1);
});

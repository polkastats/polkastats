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
// @ts-check
const Sentry = __importStar(require("@sentry/node"));
const chain_1 = require("../lib/chain");
const utils_1 = require("../lib/utils");
const pino_1 = __importDefault(require("pino"));
const backend_config_1 = require("../backend.config");
const crawlerName = 'blockListener';
Sentry.init({
    dsn: backend_config_1.backendConfig.sentryDSN,
    tracesSampleRate: 1.0,
});
const logger = (0, pino_1.default)({
    level: backend_config_1.backendConfig.logLevel,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backend_config_1.backendConfig.crawlers.find(({ name }) => name === crawlerName);
const crawler = async () => {
    logger.info(loggerOptions, 'Starting block listener crawler...');
    const client = await (0, chain_1.getClient)(loggerOptions);
    const api = await (0, chain_1.getPolkadotAPI)(loggerOptions, config.apiCustomTypes);
    let synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    while (!synced) {
        await (0, utils_1.wait)(10000);
        synced = await (0, chain_1.isNodeSynced)(api, loggerOptions);
    }
    // Subscribe to new blocks
    let iteration = 0;
    await api.rpc.chain.subscribeNewHeads(async (blockHeader) => {
        iteration++;
        const startTime = new Date().getTime();
        const blockNumber = blockHeader.number.toNumber();
        try {
            const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
            const apiAt = await api.at(blockHash);
            // Parallelize
            const [activeEra, currentIndex, { block }, extendedHeader, runtimeVersion, finalizedBlockHash, totalIssuance, timestamp,] = await Promise.all([
                apiAt.query.staking
                    .activeEra()
                    .then((res) => (res.toJSON() ? res.toJSON().index : 0))
                    .catch((e) => {
                    console.log(e);
                    return 0;
                }),
                apiAt.query.session.currentIndex().then((res) => res || 0),
                api.rpc.chain.getBlock(blockHash),
                api.derive.chain.getHeader(blockHash),
                api.rpc.state.getRuntimeVersion(blockHash),
                api.rpc.chain.getFinalizedHead(),
                apiAt.query.balances.totalIssuance(),
                apiAt.query.timestamp.now(),
            ]);
            // store current runtime metadata
            if (iteration === 1) {
                const specName = runtimeVersion.toJSON().specName;
                const specVersion = runtimeVersion.specVersion;
                await (0, chain_1.storeMetadata)(client, blockNumber, blockHash.toString(), specName.toString(), specVersion.toNumber(), timestamp.toNumber(), loggerOptions);
            }
            const finalizedBlockHeader = await api.rpc.chain.getHeader(finalizedBlockHash);
            const finalizedBlock = finalizedBlockHeader.number.toNumber();
            const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;
            // Handle chain reorganizations
            let sql = `SELECT block_number FROM block WHERE block_number = '${blockNumber}'`;
            let res = await (0, chain_1.dbQuery)(client, sql, loggerOptions);
            if (res && res.rows.length > 0) {
                // Chain reorganization detected! We need to update block_author, block_hash and state_root
                logger.debug(loggerOptions, `Detected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root`);
                const blockAuthor = extendedHeader.author;
                const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
                const blockAuthorName = (0, chain_1.getDisplayName)(blockAuthorIdentity.identity);
                sql = `UPDATE block SET block_author = '${blockAuthor}', block_author_name = '${blockAuthorName}', block_hash = '${blockHash}', state_root = '${stateRoot}' WHERE block_number = '${blockNumber}'`;
                res = await (0, chain_1.dbQuery)(client, sql, loggerOptions);
            }
            else {
                const blockAuthor = extendedHeader.author || '';
                const [blockAuthorIdentity, blockEvents, chainElectionStatus] = await Promise.all([
                    api.derive.accounts.info(blockAuthor),
                    apiAt.query.system.events(),
                    api.query.electionProviderMultiPhase.currentPhase(),
                ]);
                const blockAuthorName = (0, chain_1.getDisplayName)(blockAuthorIdentity.identity);
                // Get election status
                const isElection = Object.getOwnPropertyNames(chainElectionStatus.toJSON())[0] !== 'off';
                // Totals
                const totalEvents = blockEvents.length || 0;
                const totalExtrinsics = block.extrinsics.length;
                // Store new block
                sql = `INSERT INTO block (
            block_number,
            finalized,
            block_author,
            block_author_name,
            block_hash,
            parent_hash,
            extrinsics_root,
            state_root,
            active_era,
            current_index,
            is_election,
            spec_version,
            total_events,
            total_extrinsics,
            total_issuance,
            timestamp
          ) VALUES (
            '${blockNumber}',
            false,
            '${blockAuthor}',
            '${blockAuthorName}',
            '${blockHash}',
            '${parentHash}',
            '${extrinsicsRoot}',
            '${stateRoot}',
            '${activeEra}',
            '${currentIndex}',
            '${isElection}',
            '${runtimeVersion.specVersion}',
            '${totalEvents}',
            '${totalExtrinsics}',
            '${totalIssuance.toString()}',
            '${timestamp}'
          )
          ON CONFLICT ON CONSTRAINT block_pkey 
          DO NOTHING
          ;`;
                try {
                    await (0, chain_1.dbQuery)(client, sql, loggerOptions);
                }
                catch (error) {
                    logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}, sql: ${sql}`);
                    const scope = new Sentry.Scope();
                    scope.setTag('blockNumber', blockNumber);
                    Sentry.captureException(error, scope);
                }
                await Promise.all([
                    // Store block extrinsics
                    (0, chain_1.processExtrinsics)(api, apiAt, client, blockNumber, blockHash, block.extrinsics, blockEvents, timestamp.toNumber(), loggerOptions),
                    // Get involved addresses from block events and update its balances
                    (0, chain_1.updateAccountsInfo)(api, client, blockNumber, timestamp.toNumber(), loggerOptions, blockEvents),
                    // Store module events
                    (0, chain_1.processEvents)(client, blockNumber, parseInt(activeEra.toString()), blockEvents, block.extrinsics, timestamp.toNumber(), loggerOptions),
                    // Store block logs
                    (0, chain_1.processLogs)(client, blockNumber, blockHeader.digest.logs, timestamp.toNumber(), loggerOptions),
                ]);
                // Update finalized blocks
                await (0, chain_1.updateFinalized)(client, finalizedBlock, loggerOptions);
                const endTime = new Date().getTime();
                logger.info(loggerOptions, `Added block #${blockNumber} (${(0, utils_1.shortHash)(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(3)}s`);
            }
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}`);
            await (0, chain_1.logHarvestError)(client, blockNumber, error, loggerOptions);
            Sentry.captureException(error);
        }
    });
};
crawler().catch((error) => {
    logger.error(loggerOptions, `Crawler error: ${error}`);
    Sentry.captureException(error);
    process.exit(-1);
});

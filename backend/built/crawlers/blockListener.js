var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-check
const pino = require('pino');
const { dbQuery, getClient, getPolkadotAPI, isNodeSynced, wait, shortHash, processExtrinsics, processEvents, processLogs, getDisplayName, updateFinalized, updateAccountsInfo, logHarvestError, } = require('../lib/utils');
const backendConfig = require('../backend.config');
const crawlerName = 'blockListener';
const logger = pino({
    level: backendConfig.logLevel,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backendConfig.crawlers.find(({ name }) => name === crawlerName);
const crawler = () => __awaiter(this, void 0, void 0, function* () {
    logger.info(loggerOptions, 'Starting block listener crawler...');
    const client = yield getClient(loggerOptions);
    const api = yield getPolkadotAPI(loggerOptions, config.apiCustomTypes);
    let synced = yield isNodeSynced(api, loggerOptions);
    while (!synced) {
        // eslint-disable-next-line no-await-in-loop
        yield wait(10000);
        // eslint-disable-next-line no-await-in-loop
        synced = yield isNodeSynced(api, loggerOptions);
    }
    // Subscribe to new blocks
    yield api.rpc.chain.subscribeNewHeads((blockHeader) => __awaiter(this, void 0, void 0, function* () {
        const startTime = new Date().getTime();
        const blockNumber = blockHeader.number.toNumber();
        try {
            const blockHash = yield api.rpc.chain.getBlockHash(blockNumber);
            // Parallelize
            const [activeEra, currentIndex, { block }, extendedHeader, runtimeVersion, finalizedBlockHash, totalIssuance, timestampMs,] = yield Promise.all([
                api.query.staking.activeEra()
                    // @ts-ignore
                    .then((res) => (res.toJSON() ? res.toJSON().index : 0)),
                api.query.session.currentIndex()
                    .then((res) => (res || 0)),
                api.rpc.chain.getBlock(blockHash),
                api.derive.chain.getHeader(blockHash),
                api.rpc.state.getRuntimeVersion(blockHash),
                api.rpc.chain.getFinalizedHead(),
                api.query.balances.totalIssuance.at(blockHash),
                api.query.timestamp.now.at(blockHash),
            ]);
            const finalizedBlockHeader = yield api.rpc.chain.getHeader(finalizedBlockHash);
            const finalizedBlock = finalizedBlockHeader.number.toNumber();
            const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;
            // Handle chain reorganizations
            let sql = `SELECT block_number FROM block WHERE block_number = '${blockNumber}'`;
            let res = yield dbQuery(client, sql, loggerOptions);
            if (res && res.rows.length > 0) {
                // Chain reorganization detected! We need to update block_author, block_hash and state_root
                logger.debug(loggerOptions, `Detected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root`);
                const blockAuthor = extendedHeader.author;
                const blockAuthorIdentity = yield api.derive.accounts.info(blockAuthor);
                const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
                sql = `UPDATE block SET block_author = '${blockAuthor}', block_author_name = '${blockAuthorName}', block_hash = '${blockHash}', state_root = '${stateRoot}' WHERE block_number = '${blockNumber}'`;
                res = yield dbQuery(client, sql, loggerOptions);
            }
            else {
                const blockAuthor = extendedHeader.author || '';
                const [blockAuthorIdentity, blockEvents, chainElectionStatus,] = yield Promise.all([
                    api.derive.accounts.info(blockAuthor),
                    api.query.system.events.at(blockHash),
                    api.query.electionProviderMultiPhase.currentPhase(),
                ]);
                const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
                // Get election status
                const isElection = Object.getOwnPropertyNames(chainElectionStatus.toJSON())[0] !== 'off';
                // Totals
                const totalEvents = blockEvents.length || 0;
                const totalExtrinsics = block.extrinsics.length;
                // Store new block
                const timestamp = Math.floor(parseInt(timestampMs.toString(), 10) / 1000);
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
            spec_name,
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
            '${runtimeVersion.specName}',
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
                    yield dbQuery(client, sql, loggerOptions);
                }
                catch (error) {
                    logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}, sql: ${sql}`);
                }
                yield Promise.all([
                    // Store block extrinsics
                    processExtrinsics(api, client, blockNumber, blockHash, block.extrinsics, blockEvents, timestamp, loggerOptions),
                    // Get involved addresses from block events and update its balances
                    updateAccountsInfo(api, client, blockNumber, timestamp, loggerOptions, blockEvents),
                    // Store module events
                    processEvents(client, blockNumber, blockEvents, timestamp, loggerOptions),
                    // Store block logs
                    processLogs(client, blockNumber, blockHeader.digest.logs, timestamp, loggerOptions),
                ]);
                // Update finalized blocks
                yield updateFinalized(client, finalizedBlock, loggerOptions);
                const endTime = new Date().getTime();
                logger.info(loggerOptions, `Added block #${blockNumber} (${shortHash(blockHash.toString())}) processed in ${((endTime - startTime) / 1000).toFixed(3)}s`);
            }
        }
        catch (error) {
            logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error.stack}`);
            yield logHarvestError(client, blockNumber, error, loggerOptions);
        }
    }));
});
crawler().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(-1);
});

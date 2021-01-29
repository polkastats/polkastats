// @ts-check
const { ApiPromise, WsProvider } = require('@polkadot/api');
const pino = require('pino');
const { shortHash, storeExtrinsics, getDisplayName } = require('../utils.js');

const logger = pino();
const loggerOptions = {
  crawler: 'blockListener',
};

module.exports = {
  start: async (wsProviderUrl, pool) => {
    logger.info(loggerOptions, 'Starting block listener...');
    const wsProvider = new WsProvider(wsProviderUrl);
    const api = await ApiPromise.create({ provider: wsProvider });
    // Subscribe to new blocks
    await api.rpc.chain.subscribeNewHeads(async (blockHeader) => {
      // Get block hash
      const blockNumber = blockHeader.number.toNumber();
      const blockHash = await api.rpc.chain.getBlockHash(blockNumber);

      // Parallelize
      const [
        ChainCurrentIndex,
        ChainActiveEra,
        electionStatus,
        { block },
        extendedHeader,
      ] = await Promise.all([
        api.query.session.currentIndex.at(blockHash),
        api.query.staking.activeEra.at(blockHash),
        api.query.staking.eraElectionStatus.at(blockHash),
        api.rpc.chain.getBlock(blockHash),
        api.derive.chain.getHeader(blockHash),
      ]);

      // eslint-disable-next-line
      const activeEra = ChainActiveEra.toJSON()['index'];
      const sessionIndex = ChainCurrentIndex.toString();
      const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;

      // Get block author
      const blockAuthor = extendedHeader.author;

      // Get block author identity display name
      const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
      const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);

      // Handle chain reorganizations
      let sql = `SELECT block_number FROM block WHERE block_number = '${blockNumber}'`;
      let res = await pool.query(sql);
      if (res.rows.length > 0) {
        // Chain reorganization detected! We need to update block_author, block_hash and state_root
        logger.info(loggerOptions, `Detected chain reorganization at block #${blockNumber}, updating author, author name, hash and state root`);

        // eslint-disable-next-line
        const blockAuthor = extendedHeader.author;
        // eslint-disable-next-line
        const blockAuthorIdentity = await api.derive.accounts.info(blockAuthor);
        // eslint-disable-next-line
        const blockAuthorName = blockAuthorIdentity.identity.display || '';

        sql = `UPDATE block SET block_author = '${blockAuthor}', block_author_name = '${blockAuthorName}', block_hash = '${blockHash}', state_root = '${stateRoot}' WHERE block_number = '${blockNumber}'`;
        res = await pool.query(sql);
      } else {
        // Get block events
        const blockEvents = await api.query.system.events.at(blockHash);

        // Get election status
        const isElection = electionStatus.toString() !== 'Close';

        // Totals
        const totalEvents = blockEvents.length || 0;
        const totalExtrinsics = block.extrinsics.length;

        // Store new block
        logger.info(loggerOptions, `Adding block #${blockNumber} (${shortHash(blockHash.toString())})`);
        const timestampMs = await api.query.timestamp.now.at(blockHash);
        const timestamp = Math.floor(parseInt(timestampMs.toString(), 10) / 1000);

        sql = `INSERT INTO block (
            block_number,
            block_author,
            block_author_name,
            block_hash,
            parent_hash,
            extrinsics_root,
            state_root,
            active_era,
            session_index,
            is_election,
            total_events,
            total_extrinsics,
            timestamp
          ) VALUES (
            '${blockNumber}',
            '${blockAuthor}',
            '${blockAuthorName}',
            '${blockHash}',
            '${parentHash}',
            '${extrinsicsRoot}',
            '${stateRoot}',
            '${activeEra}',
            '${sessionIndex}',
            '${isElection}',
            '${totalEvents}',
            '${totalExtrinsics}',
            '${timestamp}'
          )
          ON CONFLICT ON CONSTRAINT block_pkey 
          DO NOTHING
          ;`;

        try {
          await pool.query(sql);
        } catch (error) {
          logger.error(loggerOptions, `Error adding block #${blockNumber}: ${error}, sql: ${sql}`);
        }

        // Store block extrinsics
        await storeExtrinsics(
          pool,
          blockNumber,
          block.extrinsics,
          blockEvents,
          timestamp,
          loggerOptions,
        );

        // Loop through the Vec<EventRecord>
        await blockEvents.forEach(async (record, index) => {
          // Extract the phase and event
          const { event, phase } = record;
          // eslint-disable-next-line
          let sql = `SELECT FROM event WHERE block_number = '${blockNumber}' AND event_index = '${index}';`;
          // eslint-disable-next-line
          let res = await pool.query(sql);

          if (res.rows.length === 0) {
            sql = `INSERT INTO event (
                block_number,
                event_index,
                section,
                method,
                phase,
                data,
                timestamp
              ) VALUES (
                '${blockNumber}',
                '${index}',
                '${event.section}',
                '${event.method}',
                '${phase.toString()}',
                '${JSON.stringify(event.data)}',
                '${timestamp}'
              )
              ON CONFLICT ON CONSTRAINT event_pkey 
              DO NOTHING
              ;`;
            try {
              await pool.query(sql);
              logger.info(loggerOptions, `Added event #${blockNumber}-${index} ${event.section} ➡ ${event.method}`);
            } catch (error) {
              logger.error(loggerOptions, `Error adding event #${blockNumber}-${index}: ${error}, sql: ${sql}`);
            }
          }
        });
      }
    });
  },
};

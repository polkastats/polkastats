// @ts-check
const { ApiPromise, WsProvider } = require('@polkadot/api');
const pino = require('pino');
const {
  shortHash, storeExtrinsics, getDisplayName, wait,
} = require('../utils.js');

const logger = pino();
const loggerOptions = {
  crawler: 'blockHarvester',
};

module.exports = {
  start: async (wsProviderUrl, pool, config) => {
    await wait(config.startDelay);
    logger.info(loggerOptions, 'Starting block harvester...');
    const startTime = new Date().getTime();
    const wsProvider = new WsProvider(wsProviderUrl);
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;

    // Get gaps from block table
    const sqlSelect = `
      SELECT
        gap_start, gap_end FROM (
          SELECT block_number + 1 AS gap_start,
          next_nr - 1 AS gap_end
          FROM (
            SELECT block_number, lead(block_number) OVER (ORDER BY block_number) AS next_nr
            FROM block
          ) nr
          WHERE nr.block_number + 1 <> nr.next_nr
        ) AS g
      UNION ALL (
        SELECT
          0 AS gap_start,
          block_number - 2 AS gap_end
        FROM
          block
        ORDER BY
          block_number
        ASC LIMIT 1
      )
      ORDER BY
        gap_end DESC
    `;
    const res = await pool.query(sqlSelect);

    // eslint-disable-next-line no-restricted-syntax
    for (const row of res.rows) {
      // Quick fix for gap 0-0 error
      if (!(row.gap_start === 0 && row.gap_end === 0)) {
        logger.info(loggerOptions, `Detected gap! Harvesting blocks from #${row.gap_end} to #${row.gap_start}`);
        // eslint-disable-next-line no-await-in-loop
        await module.exports.harvestBlocks(
          api,
          pool,
          parseInt(row.gap_start, 10),
          parseInt(row.gap_end, 10),
        );
      }
    }
    logger.info(loggerOptions, 'Disconnecting from API');
    await api.disconnect().catch((error) => logger.error(loggerOptions, `Disconnect error: ${JSON.stringify(error)}`));
    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Executed in ${((endTime - startTime) / 1000).toFixed(0)}s`);

    logger.info(loggerOptions, `Next execution in ${(config.pollingTime / 60000).toFixed(0)}m...`);
    setTimeout(
      () => module.exports.start(wsProviderUrl, pool, config),
      config.pollingTime,
    );
  },
  harvestBlocks: async (api, pool, startBlock, _endBlock) => {
    let endBlock = _endBlock;
    /* eslint-disable no-await-in-loop */
    while (endBlock >= startBlock) {
      const startTime = new Date().getTime();
      try {
        const blockHash = await api.rpc.chain.getBlockHash(endBlock);
        const [
          { block },
          blockEvents,
          blockHeader,
          timestampMs,
        ] = await Promise.all([
          api.rpc.chain.getBlock(blockHash),
          api.query.system.events.at(blockHash),
          api.derive.chain.getHeader(blockHash),
          api.query.timestamp.now.at(blockHash),
        ]);

        const blockAuthor = blockHeader.author || '';
        const blockAuthorIdentity = await api.derive.accounts.info(blockHeader.author);
        const blockAuthorName = getDisplayName(blockAuthorIdentity.identity);
        const timestamp = Math.floor(timestampMs / 1000);
        const { parentHash, extrinsicsRoot, stateRoot } = blockHeader;

        // Store block events
        try {
          // eslint-disable-next-line no-loop-func
          blockEvents.forEach(async (record, index) => {
            const { event, phase } = record;
            const sql = `INSERT INTO event (
                block_number,
                event_index,
                section,
                method,
                phase,
                data,
                timestamp
              ) VALUES (
                '${endBlock}',
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
              logger.info(loggerOptions, `Added event #${endBlock}-${index} ${event.section} ➡ ${event.method}`);
            } catch (error) {
              logger.error(loggerOptions, `Error adding event #${endBlock}-${index}: ${error}, sql: ${sql}`);
            }
          });
        } catch (error) {
          logger.error(loggerOptions, `Error getting events for block ${endBlock} (${blockHash}): ${error}`);
          const errorString = error.toString().replace(/'/g, "''");
          const sql = `INSERT INTO harvester_error (block_number, error, timestamp)
              VALUES ('${endBlock}', '${errorString}', '${timestamp}');
          `;
          await pool.query(sql);
        }

        // Store block extrinsics
        try {
          await storeExtrinsics(
            pool,
            endBlock,
            block.extrinsics,
            blockEvents,
            timestamp,
            loggerOptions,
          );
        } catch (error) {
          logger.error(loggerOptions, `Error getting extrinsics for block ${endBlock} (${blockHash}): ${error}`);
          const errorString = error.toString().replace(/'/g, "''");
          const sql = `INSERT INTO harvester_error (block_number, error, timestamp)
            VALUES ('${endBlock}', '${errorString}', '${timestamp}');
          `;
          await pool.query(sql);
        }

        // Totals
        const totalEvents = blockEvents.length;
        const totalExtrinsics = block.extrinsics.length;

        const sqlInsert = `INSERT INTO block (
            block_number,
            finalized,
            block_author,
            block_author_name,
            block_hash,
            parent_hash,
            extrinsics_root,
            state_root,
            total_events,
            total_extrinsics,
            timestamp
          ) VALUES (
            '${endBlock}',
            false,
            '${blockAuthor}',
            '${blockAuthorName}',
            '${blockHash}',
            '${parentHash}',
            '${extrinsicsRoot}',
            '${stateRoot}',
            '${totalEvents}',
            '${totalExtrinsics}',
            '${timestamp}'
          )
          ON CONFLICT ON CONSTRAINT block_pkey 
          DO NOTHING
          ;`;
        try {
          await pool.query(sqlInsert);
          const endTime = new Date().getTime();
          logger.info(loggerOptions, `Added block #${endBlock} (${shortHash(blockHash.toString())}) in ${((endTime - startTime) / 1000).toFixed(3)}s`);
        } catch (error) {
          logger.error(loggerOptions, `Error adding block #${endBlock}: ${error}`);
        }
        endBlock -= 1;
      } catch (error) {
        logger.error(loggerOptions, `Error adding block #${endBlock}: ${error}`);
        const timestamp = new Date().getTime();
        const errorString = error.toString().replace(/'/g, "''");
        const sql = `INSERT INTO harvester_error (block_number, error, timestamp)
          VALUES ('${endBlock}', '${errorString}', '${timestamp}');
        `;
        await pool.query(sql);
        endBlock -= 1;
      }
    }
  },
};

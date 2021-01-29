// @ts-check
const pino = require('pino');

const logger = pino();

module.exports = {
  formatNumber: (number) => (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'),
  shortHash: (hash) => `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`,
  wait: async (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  }),
  storeExtrinsics: async (pool, blockNumber, extrinsics, blockEvents, timestamp, loggerOptions) => {
    const startTime = new Date().getTime();
    extrinsics.forEach(async (extrinsic, index) => {
      const { isSigned } = extrinsic;
      const signer = isSigned ? extrinsic.signer.toString() : '';
      const { section } = extrinsic.toHuman().method;
      const { method } = extrinsic.toHuman().method;
      const args = JSON.stringify(extrinsic.args);
      const hash = extrinsic.hash.toHex();
      const doc = extrinsic.meta.documentation.toString().replace(/'/g, "''");
      const success = module.exports.getExtrinsicSuccess(index, blockEvents);
      const sql = `INSERT INTO extrinsic (
          block_number,
          extrinsic_index,
          is_signed,
          signer,
          section,
          method,
          args,
          hash,
          doc,
          success,
          timestamp
        ) VALUES (
          '${blockNumber}',
          '${index}',
          '${isSigned}',
          '${signer}',
          '${section}',
          '${method}',
          '${args}',
          '${hash}',
          '${doc}',
          '${success}',
          '${timestamp}'
        )
        ON CONFLICT ON CONSTRAINT extrinsic_pkey 
        DO NOTHING;
        ;`;
      try {
        await pool.query(sql);
        logger.info(loggerOptions, `Added extrinsic ${blockNumber}-${index} (${module.exports.shortHash(hash)}) ${section} ➡ ${method}`);
      } catch (error) {
        logger.error(loggerOptions, `Error adding extrinsic ${blockNumber}-${index}: ${JSON.stringify(error)}`);
      }
    });

    // Log execution time
    const endTime = new Date().getTime();
    logger.info(loggerOptions, `Added ${extrinsics.length} extrinsics in ${((endTime - startTime) / 1000).toFixed(3)}s`);
  },
  getExtrinsicSuccess: (index, blockEvents) => {
    // assume success if no events were extracted
    if (blockEvents.length === 0) {
      return true;
    }
    let extrinsicSuccess = false;
    blockEvents.forEach((record) => {
      const { event, phase } = record;
      if (
        parseInt(phase.toHuman().ApplyExtrinsic, 10) === index
        && event.section === 'system'
        && event.method === 'ExtrinsicSuccess'
      ) {
        extrinsicSuccess = true;
      }
    });
    return extrinsicSuccess;
  },
  getDisplayName: (identity) => {
    if (
      identity.displayParent
      && identity.displayParent !== ''
      && identity.display
      && identity.display !== ''
    ) {
      return `${identity.displayParent} / ${identity.display}`;
    }
    return identity.display || '';
  },
};
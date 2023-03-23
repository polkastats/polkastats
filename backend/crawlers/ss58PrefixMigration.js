// @ts-check
const pino = require('pino');
const {
    wait,
    getClient,
    getPolkadotAPI,
    isNodeSynced,
    dbParamQuery,
    dbQuery,
} = require('../lib/utils');
const keyring = require('@polkadot/keyring');

const backendConfig = require('../backend.config');

const crawlerName = 'ss58PrefixMigration';

const logger = pino({
    level: backendConfig.logLevel,
});
const loggerOptions = {
    crawler: crawlerName,
};
const config = backendConfig.crawlers.find(
    ({name}) => name === crawlerName,
);

// TODO: Move to ENV Variable
const newSs58Prefix = 54;

const decode = (address) => {
    if (address.startsWith('0x')) {
        console.log('Address starts with 0x', address);
        return address;
    } else {
        return keyring.encodeAddress(
            keyring.decodeAddress(address),
            newSs58Prefix);
    }
};

const migrateBlockTable = async (client) => {
    logger.info(loggerOptions, 'Start Migration for Block table');

    const result = await dbQuery(client, `SELECT DISTINCT block_author  FROM block WHERE block_author LIKE '5%'`, loggerOptions);

    logger.info(loggerOptions, `Selected ${result.rowCount} accounts from block table`);

    await dbQuery(client, `BEGIN;`, loggerOptions);

    for (const row of result.rows) {
        const {block_author} = row;
        const nextAddress = decode(block_author);
        logger.info(loggerOptions, `Start Migration for ${block_author} -> ${nextAddress}`);

        const sql = `UPDATE block SET block_author='${nextAddress}' WHERE block_author='${block_author}'`;

        await dbQuery(client, sql, loggerOptions);

        logger.info(loggerOptions, `Finished Migration for ${block_author} -> ${nextAddress}`);
    }
    ;

    await dbQuery(client, `COMMIT;`, loggerOptions);

    logger.info(loggerOptions, `Finished migration for Block table`);
};

const crawler = async () => {

    logger.info(loggerOptions, 'Running ss58 prefix migration crawler...');

    const client = await getClient(loggerOptions);

    await migrateBlockTable(client);
};

crawler(true).catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(-1);
});

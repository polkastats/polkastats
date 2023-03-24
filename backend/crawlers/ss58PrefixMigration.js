// @ts-check
const pino = require('pino');
const keyring = require('@polkadot/keyring');
const {
    getClient,
    dbQuery,
} = require('../lib/utils');

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

const decode = (address) => {
    if (address.startsWith('0x')) {
        console.log('Address starts with 0x', address);
        return address;
    } else {
        return keyring.encodeAddress(
            keyring.decodeAddress(address),
            config.ss58Prefix);
    }
};

const migrateBlockTable = async (client) => {
    logger.info(loggerOptions, 'Start migration for Block table');

    const result = await dbQuery(client, `SELECT DISTINCT block_author  FROM block WHERE block_author LIKE '5%'`, loggerOptions);

    logger.info(loggerOptions, `Selected ${result.rowCount} accounts from block table`);

    for (const row of result.rows) {
        const {block_author} = row;
        const nextAddress = decode(block_author);

        logger.info(loggerOptions, `Start migration for ${block_author}`);

        await dbQuery(client, `UPDATE block SET block_author='${nextAddress}' WHERE block_author='${block_author}'`, loggerOptions);

        logger.info(loggerOptions, `Finished migration for ${block_author}`);
    }
    ;

    logger.info(loggerOptions, '✅ Finished migration for Block table');
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

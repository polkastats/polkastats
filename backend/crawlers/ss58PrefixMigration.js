// @ts-check
const pino = require('pino');
const keyring = require('@polkadot/keyring');
const {
    getClient,
    dbQuery,
} = require('../lib/utils');

const backendConfig = require('../backend.config');
const {logLevel} = require("../backend.config");

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

const changeAccountInArgs = (args) => {
    if (typeof args !== 'string') {
        logger.warning(loggerOptions, 'args are not a sting');
        return args;
    }
    // Extract list of accounts
    const accounts = args.match(/"5[a-zA-Z0-9]{47}"/gm);
    let result = args;

    if (Array.isArray(accounts)) {
        accounts.forEach((account) => {
            // Slice is needed to remove ""
            const slicedAccount = account.slice(1, -1);
            result = result.replace(slicedAccount, decode(slicedAccount));
        });
    }

    return result;
};

const migrateDataForEvent = async (client, defaultStartBlock = 0) => {
    logger.info(loggerOptions, 'Start migration for data property for event table');

    const result = await dbQuery(client, `SELECT MIN(block_number), MAX(block_number) FROM event WHERE method NOT LIKE 'ExtrinsicSuccess' AND data LIKE '%"5%'`, loggerOptions);
    const {min, max} = result.rows[0];

    let startBlock = defaultStartBlock || +min;
    const endBlock = +max;
    const batchSize = config.batchSize || 50000;

    console.log(startBlock, endBlock, min, max);

    while (startBlock < endBlock) {
        const sql = `SELECT block_number, event_index, data FROM event WHERE method NOT LIKE 'ExtrinsicSuccess' AND data LIKE '%"5%' AND block_number BETWEEN ${startBlock} AND ${startBlock + batchSize};`;
        const {rowCount, rows} = await dbQuery(client, sql);

        startBlock += batchSize;

        if (!rowCount) {
            logger.info(loggerOptions, `Skiped for batch ${startBlock} -> ${endBlock + batchSize}`);
        } else {
            logger.info(loggerOptions, `Extracted ${rowCount} rows. Batch ${startBlock} -> ${startBlock + batchSize}`);

            for (row of rows) {
                const {data, block_number, event_index} = row;
                const nextData = changeAccountInArgs(data);
                if (data !== nextData) {
                    await dbQuery(client, `UPDATE event SET data='${nextData}' WHERE block_number=${block_number} AND event_index=${event_index};`);
                }
            }
            logger.info(loggerOptions, `Finished batching for ${startBlock} -> ${endBlock + batchSize}`);
        }
    }
};

const migrateArgsForExtrinsic = async (client, defaultStartBlock = 0) => {
    logger.info(loggerOptions, 'Start migration for args property for extrinsic table');

    const result = await dbQuery(client, `SELECT MIN(block_number), MAX(block_number) FROM extrinsic WHERE is_signed = TRUE;`, loggerOptions);
    const {min, max} = result.rows[0];

    let startBlock = defaultStartBlock || +min;
    const endBlock = +max;
    const batchSize = config.batchSize || 50000;

    while (startBlock < endBlock) {
        const sql = `SELECT block_number, extrinsic_index, args FROM extrinsic WHERE is_signed = TRUE AND block_number BETWEEN ${startBlock} AND ${startBlock + batchSize};`;
        const {rows, rowCount} = await dbQuery(client, sql);

        startBlock += batchSize;

        if (!rowCount) {
            logger.info(loggerOptions, `Skiped for batch ${startBlock} -> ${endBlock + batchSize}`);
        } else {
            logger.info(loggerOptions, `Extracted ${rowCount} rows. Batch ${startBlock} -> ${startBlock + batchSize}`);

            for (row of rows) {
                const {args, block_number, extrinsic_index} = row;
                const nextArgs = changeAccountInArgs(args);
                if (args !== nextArgs) {
                    await dbQuery(client, `UPDATE extrinsic SET args='${nextArgs}' WHERE block_number=${block_number} AND extrinsic_index=${extrinsic_index};`);
                }
            }
            logger.info(loggerOptions, `Finished batching for ${startBlock} -> ${endBlock + batchSize}`);
        }
    }
};

const migrateSignerProperty = async (client) => {
    logger.info(loggerOptions, 'Start migration for signer property for extrinsic table');

    const result = await dbQuery(client, `SELECT DISTINCT signer FROM extrinsic WHERE signer LIKE '5%'`, loggerOptions);

    logger.info(loggerOptions, `Selected ${result.rowCount} signer from extrinsic table`);

    for (const row of result.rows) {
        const {signer} = row;
        const nextAddress = decode(signer);

        console.log(`Signer is ${signer}, ${nextAddress}`);

        logger.info(loggerOptions, `Start migration for ${signer}`);

        await dbQuery(client, `UPDATE extrinsic SET signer='${nextAddress}' WHERE signer='${signer}'`, loggerOptions);

        logger.info(loggerOptions, `Finished migration for ${signer}`);
    }

    logger.info(loggerOptions, '✅ Finished migration for signer property for exricnsic table');
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

    // Event table
    await migrateDataForEvent(client);

    // Extrinsic table
    await migrateArgsForExtrinsic(client);
    await migrateSignerProperty(client);

    // // Block table
    await migrateBlockTable(client);
};

crawler(true).catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(-1);
});

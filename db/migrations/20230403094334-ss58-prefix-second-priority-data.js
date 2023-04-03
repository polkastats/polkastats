'use strict';
var dbm;
var type;
var seed;
var fs = require('fs');
var path = require('path');
const {
    SS58_PREFIX_OLD,
    SS58_PREFIX_NEW,
    executeDbRunSqlAsPromise,
    Logger,
    decode,
} = require('./shared/ss58-prefix/index.js');
var Promise;

/**
 * We receive the dbmigrate dependency from dbmigrate initially.
 * This enables us to not have to rely on NODE_PATH.
 */
exports.setup = function (options, seedLink) {
    dbm = options.dbmigrate;
    type = dbm.dataType;
    seed = seedLink;
    Promise = options.Promise;
};

const changeAccountInJSON = (args, ss58Format) => {
    if (typeof args !== 'string') {
        console.log('args are not a sting');
        return args;
    }
    // Extract list of accounts
    const accounts = args.match(/"5[a-zA-Z0-9]{47}"/gm);
    let result = args;

    if (Array.isArray(accounts)) {
        accounts.forEach((account) => {
            // Slice is needed to remove ""
            const slicedAccount = account.slice(1, -1);
            result = result.replace(slicedAccount, decode(slicedAccount, ss58Format));
        });
    }

    return result;
};

const migrateDataForEvent = async (db, ss58Format) => {
    console.log('Start migration for data property for event table');

    const result = await executeDbRunSqlAsPromise(db, `SELECT MIN(block_number), MAX(block_number) FROM event WHERE method NOT LIKE 'ExtrinsicSuccess' AND data LIKE '%"5%'`);
    const {min, max} = result.rows[0];

    let startBlock = +min;
    const endBlock = +max;
    const batchSize = 50000;

    while (startBlock < endBlock) {
        const sql = `SELECT block_number, event_index, data FROM event WHERE method NOT LIKE 'ExtrinsicSuccess' AND data LIKE '%"5%' AND block_number BETWEEN ${startBlock} AND ${startBlock + batchSize};`;
        const {rowCount, rows} = await executeDbRunSqlAsPromise(db, sql);

        startBlock += batchSize;

        if (!rowCount) {
            console.log(`Skiped for batch ${startBlock} -> ${endBlock + batchSize}`);
        } else {
            console.log(`Extracted ${rowCount} rows. Batch ${startBlock} -> ${startBlock + batchSize}`);

            for (const row of rows) {
                const {data, block_number, event_index} = row;
                const nextData = changeAccountInJSON(data, ss58Format);
                if (data !== nextData) {
                    await executeDbRunSqlAsPromise(db, `UPDATE event SET data='${nextData}' WHERE block_number=${block_number} AND event_index=${event_index};`);
                }
            }
            console.log(`Finished batching for ${startBlock} -> ${endBlock + batchSize}`);
        }
    }

    console.log('✅ Finished migration for data property for event table');
};

const migrateArgsForExtrinsic = async (db, ss58Format) => {
    console.log('Start migration for args property for extrinsic table');

    const result = await executeDbRunSqlAsPromise(db, `SELECT MIN(block_number), MAX(block_number) FROM extrinsic WHERE is_signed = TRUE;`);
    const {min, max} = result.rows[0];

    let startBlock = +min;
    const endBlock = +max;
    const batchSize = 50000;

    while (startBlock < endBlock) {
        const sql = `SELECT block_number, extrinsic_index, args FROM extrinsic WHERE is_signed = TRUE AND block_number BETWEEN ${startBlock} AND ${startBlock + batchSize};`;
        const {rows, rowCount} = await executeDbRunSqlAsPromise(db, sql);

        startBlock += batchSize;

        if (!rowCount) {
            console.log(`Skiped for batch ${startBlock} -> ${endBlock + batchSize}`);
        } else {
            console.log(`Extracted ${rowCount} rows. Batch ${startBlock} -> ${startBlock + batchSize}`);

            for (const row of rows) {
                const {args, block_number, extrinsic_index} = row;
                const nextArgs = changeAccountInJSON(args, ss58Format);
                if (args !== nextArgs) {
                    await executeDbRunSqlAsPromise(db, `UPDATE extrinsic SET args='${nextArgs}' WHERE block_number=${block_number} AND extrinsic_index=${extrinsic_index};`);
                }
            }
            console.log(`Finished batching for ${startBlock} -> ${endBlock + batchSize}`);
        }
    }

    console.log('✅ Finished migration for args property for extrinsic table');
};

const migrateSignerProperty = async (db, ss58Format) => {
    console.log('Start migration for signer property for extrinsic table');

    const result = await executeDbRunSqlAsPromise(db, `SELECT DISTINCT signer FROM extrinsic WHERE signer LIKE '5%'`);

    console.log(`Selected ${result.rowCount} signer from extrinsic table`);

    for (const row of result.rows) {
        const {signer} = row;
        const nextAddress = decode(signer, ss58Format);

        console.log(`Start migration for ${signer}`);

        await executeDbRunSqlAsPromise(db, `UPDATE extrinsic SET signer='${nextAddress}' WHERE signer='${signer}'`);

        console.log(`Finished migration for ${signer}`);
    }

    console.log('✅ Finished migration for signer property for exricnsic table');
};

const migrateBlockTable = async (db, ss58Format) => {
    console.log('Start migration for Block table');

    const result = await executeDbRunSqlAsPromise(db, `SELECT DISTINCT block_author  FROM block WHERE block_author LIKE '5%'`);

    console.log(`Selected ${result.rowCount} accounts from block table`);

    for (const row of result.rows) {
        const {block_author} = row;
        const nextAddress = decode(block_author, ss58Format);

        console.log(`Start migration for ${block_author}`);

        await executeDbRunSqlAsPromise(db, `UPDATE block SET block_author='${nextAddress}' WHERE block_author='${block_author}'`);

        console.log(`Finished migration for ${block_author}`);
    }

    console.log('✅ Finished migration for Block table');
};

const convertTables = async (db, ss58Format) => {
    await migrateBlockTable(db, ss58Format);
    await migrateSignerProperty(db, ss58Format);
    await migrateArgsForExtrinsic(db, ss58Format);
    await migrateDataForEvent(db, ss58Format);
};

exports.up = function (db) {
    return convertTables(db, SS58_PREFIX_NEW);
};

exports.down = function (db) {
    return convertTables(db, SS58_PREFIX_OLD);
};

exports._meta = {
    "version": 1
};

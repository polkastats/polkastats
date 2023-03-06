'use strict';

var dbm;
var type;
var seed;
var keyring = require('@polkadot/keyring');
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

// Migration script for Account Table
const convertAccountTable = (db, ss58Format) => {
    return db.runSql('SELECT * from account;', (_, result) => {
        result.rows.forEach(({ account_id, balances }) => {

            const nextAddress = keyring.encodeAddress(
                keyring.decodeAddress(account_id),
                ss58Format);

            const nextBalances = balances.replace(account_id, nextAddress);

            const queryString = `UPDATE account SET account_id='${nextAddress}', balances='${nextBalances}' WHERE account_id='${account_id}';`

            db.runSql(queryString);
        });
    });
}

// Migration script for featured, era_commission, era_points, era_relative_performance, era_self_stake, era_vrc_score tables
const convertEraTables = (db, ss58Format) => {
    const tables = [
        'featured',
        'era_commission',
        'era_points',
        'era_relative_performance',
        'era_self_stake',
        'era_vrc_score',
    ];
    tables.forEach((table) => {
        db.runSql(`SELECT * from ${table}`, (_, result) => {

            result.rows.forEach((row) => {
                const currentAccountId = row.stash_address;

                const nextAddress = keyring.encodeAddress(
                    keyring.decodeAddress(currentAccountId),
                    ss58Format);

                const queryString = `UPDATE ${table} SET stash_address='${nextAddress}' WHERE stash_address='${currentAccountId}';`

                db.runSql(queryString);

            });

        });
    });
};

const convertRankingTable = (db, ss58Format) => {
    return db.runSql('SELECT * from ranking;', (_, result) => {

        result.rows.forEach(({ identity, stash_address, controller_address }) => {
            const nextStashAddress = keyring.encodeAddress(
                keyring.decodeAddress(stash_address),
                ss58Format);

            const nextControllerAddress = keyring.encodeAddress(
                keyring.decodeAddress(controller_address),
                ss58Format);

            // TODO: Think how to deal with identity? Regex for addresses
            const nextIdentity = identity;

            const queryString = `UPDATE ranking SET identity='${nextIdentity}', stash_address='${nextStashAddress}', controller_address='${nextControllerAddress}' WHERE stash_address='${stash_address}';`
            console.log("Prev and next", queryString);

            db.runSql(queryString);
        });

    });
}

const convertBlockTable = async (db, ss55Format) => {

    return db.runSql('SELECT block_author from block;', (_, result) => {
        const totalRows = result.rows.length;
        const batchSize = 10000;
        let currentIndex = 0;

        const updateBlock = (block_author) => {
            const nextBlockAuthor = keyring.encodeAddress(
                keyring.decodeAddress(block_author),
                ss55Format);

            const queryString = `UPDATE block SET block_author='${nextBlockAuthor}' WHERE block_author='${block_author}';`

            db.runSql(queryString);
        };

        while(currentIndex < totalRows) {
            const currentBatch = result.rows.slice(currentIndex, currentIndex + batchSize);

            currentBatch.forEach(({ block_author }) => {
                updateBlock(block_author);
            });

            currentIndex+= batchSize;
        };
    });
};

exports.up = async function (db) {
    convertAccountTable(db, 54);
    convertEraTables(db, 54);
    convertRankingTable(db, 54);
    // convertBlockTable(db, 54);
};

exports.down = async function (db) {
    convertAccountTable(db, 42);
    convertEraTables(db, 42);
    convertRankingTable(db, 42);
    // convertBlockTable(db, 42);
};

exports._meta = {
    "version": 1
};

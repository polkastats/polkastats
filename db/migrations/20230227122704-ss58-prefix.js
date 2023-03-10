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
    db.runSql('SELECT * from account;', (_, result) => {
        result.rows.forEach(({account_id, balances}) => {

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

            result.rows.forEach(({stash_address}) => {

                const nextAddress = keyring.encodeAddress(
                    keyring.decodeAddress(stash_address),
                    ss58Format);

                // TODO: check where condition!
                const queryString = `UPDATE ${table} SET stash_address='${nextAddress}' WHERE stash_address='${stash_address}';`

                db.runSql(queryString);

            });

        });
    });
};

const convertRankingTable = (db, ss58Format) => {
    db.runSql('SELECT * from ranking;', (_, result) => {

        result.rows.forEach(({identity, stash_address, controller_address}) => {
            const nextStashAddress = keyring.encodeAddress(
                keyring.decodeAddress(stash_address),
                ss58Format);

            const nextControllerAddress = keyring.encodeAddress(
                keyring.decodeAddress(controller_address),
                ss58Format);

            // TODO: Think how to deal with identity? Regex for addresses
            const nextIdentity = identity;

            const queryString = `UPDATE ranking SET identity='${nextIdentity}', stash_address='${nextStashAddress}', controller_address='${nextControllerAddress}' WHERE stash_address='${stash_address}';`

            db.runSql(queryString);
        });

    });
}

const convertFaucetTable = (db, ss58Format) => {
    db.runSql('SELECT * from faucet;', (_, result) => {

        result.rows.forEach(({ id, sender, destination }) => {
            const nextSender = keyring.encodeAddress(
                keyring.decodeAddress(sender),
                ss58Format);

            const nextDestination = keyring.encodeAddress(
                keyring.decodeAddress(destination),
                ss58Format);

            const queryString = `UPDATE faucet SET sender='${nextSender}', destination='${nextDestination}' WHERE id='${id}';`

            db.runSql(queryString);
        });

    });
}

// This batching approach is very slow, it should be replaced with creating temp. table and joining https://stackoverflow.com/questions/35903375/how-to-update-large-table-with-millions-of-rows-in-sql-server
const convertBlockTable = (db, ss55Format) => {
    db.runSql('SELECT block_author from block;', (_, result) => {
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

        while (currentIndex < totalRows) {
            const currentBatch = result.rows.slice(currentIndex, currentIndex + batchSize);

            currentBatch.forEach(({block_author}) => {
                updateBlock(block_author);
            });

            currentIndex += batchSize;
        }
    });
};

const convertTables = (db, prefix) => {
    convertAccountTable(db, prefix);
    convertEraTables(db, prefix);
    convertRankingTable(db, prefix);
    convertFaucetTable(db, prefix);
    // convertBlockTable(db, prefix);
}

exports.up = async function (db) {
    convertTables(db, 54);
};

exports.down = async function (db) {
    convertTables(db, 42);
};

exports._meta = {
    "version": 1
};

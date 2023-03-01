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

exports.up = function (db) {
    db.startMigration();
    convertAccountTable(db, 54);
    convertEraTables(db, 54);
    return db.endMigration();
};

exports.down = function (db) {
    db.startMigration();
    convertAccountTable(db, 42);
    convertEraTables(db, 42);
    return db.endMigration();
};

exports._meta = {
    "version": 1
};

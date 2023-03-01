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

const convertAccountTable = (db, ss58Format) => {
    return db.runSql('SELECT * from account;', (_, result) => {

        result.rows.forEach((row) => {
            const currentAccountId = row.account_id;

            const nextAddress = keyring.encodeAddress(
                keyring.decodeAddress(currentAccountId),
                ss58Format);

            const queryString = `UPDATE account SET account_id='${nextAddress}' WHERE account_id='${currentAccountId}';`

            db.runSql(queryString);
        });

    });
}

exports.up = function (db) {
    db.startMigration();
    convertAccountTable(db, 54);
    return db.endMigration();
};

exports.down = function (db) {
    db.startMigration();
    convertAccountTable(db, 42);
    return db.endMigration();
};

exports._meta = {
    "version": 1
};

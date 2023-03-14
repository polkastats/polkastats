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

class Logger {
    constructor(tableName) {
        this.tableName = tableName;
        this.totalRows = 0;
        this.currentRow = 0;
    }

    setTotalRows = (totalRows) => {
        this.totalRows = totalRows;
    }

    log = () => {
        this.currentRow++;
        const {currentRow, totalRows, tableName} = this;

        if (currentRow === totalRows) {
            console.log(`✅ Done for ${tableName} table`);
        } else {
            console.log(`⏳ Migrated ${Math.trunc(currentRow / totalRows * 10000) / 100}% for ${tableName} table`);
        }
    }
}

// Migration script for Account Table
const convertAccountTable = (db, ss58Format) => {
    const logger = new Logger('account');

    db.runSql('SELECT account_id, balances, identity from account;', (_, result) => {
        logger.setTotalRows(result.rows.length);
        result.rows.forEach(({account_id, balances, identity}) => {

            const nextAddress = keyring.encodeAddress(
                keyring.decodeAddress(account_id),
                ss58Format);

            const nextBalances = balances.replace(account_id, nextAddress);

            let queryString = `UPDATE account SET account_id='${nextAddress}', balances='${nextBalances}'`

            if (identity?.includes("parent")) {
                const currentParent = JSON.parse(identity).parent;

                const nextParent = keyring.encodeAddress(
                    keyring.decodeAddress(currentParent),
                    ss58Format);

                const nextIdentity = identity.replace(currentParent, nextParent);

                queryString += `, identity='${nextIdentity}'`
            }

            queryString += ` WHERE account_id='${account_id}';`

            db.runSql(queryString, logger.log);
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
        const logger = new Logger(table);

        db.runSql(`SELECT DISTINCT stash_address from ${table}`, (_, result) => {
            logger.setTotalRows(result.rows.length);

            result.rows.forEach(({stash_address}) => {

                const nextAddress = keyring.encodeAddress(
                    keyring.decodeAddress(stash_address),
                    ss58Format);

                const queryString = `UPDATE ${table} SET stash_address='${nextAddress}' WHERE stash_address='${stash_address}';`

                db.runSql(queryString, logger.log);

            });

        });
    });
};

const convertRankingTable = (db, ss58Format) => {
    const logger = new Logger('ranking');

    db.runSql('SELECT identity, stash_address, controller_address, rank from ranking;', (_, result) => {
        logger.setTotalRows(result.rows.length);

        result.rows.forEach(({identity, stash_address, controller_address, rank}) => {
            const nextStashAddress = keyring.encodeAddress(
                keyring.decodeAddress(stash_address),
                ss58Format);

            const nextControllerAddress = keyring.encodeAddress(
                keyring.decodeAddress(controller_address),
                ss58Format);

            let queryString = `UPDATE ranking SET stash_address='${nextStashAddress}', controller_address='${nextControllerAddress}'`

            if (identity?.includes("parent")) {
                const currentParent = JSON.parse(identity).parent;

                const nextParent = keyring.encodeAddress(
                    keyring.decodeAddress(currentParent),
                    ss58Format);

                const nextIdentity = identity.replace(currentParent, nextParent);

                queryString += `, identity='${nextIdentity}'`
            }

            queryString += ` WHERE rank='${rank}'`;

            db.runSql(queryString, logger.log);
        });

    });
}

const convertFaucetTable = (db, ss58Format) => {
    const logger = new Logger('faucet');

    db.runSql('SELECT id, sender, destination from faucet;', (_, result) => {
        logger.setTotalRows(result.rows.length);

        result.rows.forEach(({id, sender, destination}) => {
            const nextSender = keyring.encodeAddress(
                keyring.decodeAddress(sender),
                ss58Format);

            const nextDestination = keyring.encodeAddress(
                keyring.decodeAddress(destination),
                ss58Format);

            const queryString = `UPDATE faucet SET sender='${nextSender}', destination='${nextDestination}' WHERE id='${id}';`

            db.runSql(queryString, logger.log);
        });

    });
}

// Transfers are a part of extrinsict table
const convertTransfers = (db, ss58Format) => {
    const logger = new Logger('transfer');

    db.runSql(`select block_number, signer, args, method from extrinsic where method like 'transfer%'`, (_, result) => {
        logger.setTotalRows(result.rows.length);

        result.rows.forEach(({block_number, signer, args, method}) => {
            const nextSigner = keyring.encodeAddress(
                keyring.decodeAddress(signer),
                ss58Format);

            let queryString = `UPDATE extrinsic SET signer='${nextSigner}'`

            if (method === 'transfer' || method === 'transferKeepAlive') {
                const [account] = JSON.parse(args);
                const accountId = typeof account === 'string' ? account : account.id;
                const nextAccountId = keyring.encodeAddress(
                    keyring.decodeAddress(accountId),
                    ss58Format);
                const nextArgs = args.replace(accountId, nextAccountId);
                queryString += `, args='${nextArgs}'`;
            }

            queryString += ` WHERE block_number='${block_number}';`

            db.runSql(queryString, logger.log);
        });

    });
};

const convertTables = (db, prefix) => {
    convertAccountTable(db, prefix);
    convertEraTables(db, prefix);
    convertRankingTable(db, prefix);
    convertFaucetTable(db, prefix);
    convertTransfers(db, prefix);
}

exports.up = async function (db) {
    const newSs58Prefix = 54;
    convertTables(db, newSs58Prefix);
};

exports.down = async function (db) {
    const oldSs58Prefix = 42;
    convertTables(db, oldSs58Prefix);
};

exports._meta = {
    "version": 1
};

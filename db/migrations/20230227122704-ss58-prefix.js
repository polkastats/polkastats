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
            if (currentRow % 150 === 0) {
                console.log(`⏳ Migrated ${Math.trunc(currentRow / totalRows * 10000) / 100}% for ${tableName} table`);
            }
        }
    }
}

const decode = (address, ss58) => {
    if (address.startsWith('0x')) {
        console.log('Address starts with 0x', address);
        return address;
    } else {
        return keyring.encodeAddress(
            keyring.decodeAddress(address),
            ss58);
    }
};

// Migration script for Account Table
const convertAccountTable = (db, ss58Format) => {
    const logger = new Logger('account');

    return new Promise(function(resolve, reject) {
        db.runSql('SELECT account_id, balances, identity from account;', (_, result) => {
            logger.setTotalRows(result.rows.length);

            for (let i = 0; i < result.rows.length; i++) {
            for (let i = 0; i < 1; i++) {
                const {account_id, balances, identity} = result.rows[i];

                const nextAddress = decode(account_id, ss58Format);

                const nextBalances = balances.replace(account_id, nextAddress);

                let queryString = `UPDATE account SET account_id='${nextAddress}', balances='${nextBalances}'`

                if (identity?.includes("parent")) {
                    const currentParent = JSON.parse(identity).parent;

                    const nextParent = decode(currentParent, ss58Format);

                    const nextIdentity = identity.replace(currentParent, nextParent);

                    queryString += `, identity='${nextIdentity}'`
                }

                queryString += ` WHERE account_id='${account_id}';`

                console.log(`Query is ${queryString}`);

                db.runSql(queryString, (e, r) => {
                    logger.log();
                    if (e !== null) {
                        console.log(`${e} + ${JSON.stringify(r)}`);
                    }
                    if (i === result.rows.length - 1) {
                        resolve();
                    }
                });
            }
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

                const nextAddress = decode(stash_address, ss58Format)

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

            const nextStashAddress = decode(stash_address, ss58Format);

            const nextControllerAddress = decode(controller_address, ss58Format);

            let queryString = `UPDATE ranking SET stash_address='${nextStashAddress}', controller_address='${nextControllerAddress}'`

            if (identity?.includes("parent")) {
                const currentParent = JSON.parse(identity).parent;

                const nextParent = decode(currentParent, ss58Format);

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

            const nextSender = decode(sender, ss58Format);

            const nextDestination = decode(destination, ss58Format);

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
            const nextSigner = decode(signer, ss58Format);

            let queryString = `UPDATE extrinsic SET signer='${nextSigner}'`

            if (method === 'transfer' || method === 'transferKeepAlive' || method === 'transferAll') {
                const [account] = JSON.parse(args);
                const accountId = typeof account === 'string' ? account : account.id ? account.id : account.address20;

                const nextAccountId = decode(accountId, ss58Format);

                const nextArgs = args.replace(accountId, nextAccountId);
                queryString += `, args='${nextArgs}'`;
            }

            queryString += ` WHERE block_number='${block_number}';`

            db.runSql(queryString, logger.log);
        });

    });
};

const convertTables = (db, prefix) => {
    return convertAccountTable(db, prefix);
    // convertEraTables(db, prefix);
    // convertRankingTable(db, prefix);
    // convertFaucetTable(db, prefix);
    // convertTransfers(db, prefix);
}

exports.up = async function (db) {
    const newSs58Prefix = 54;
    return convertTables(db, newSs58Prefix);
};

exports.down = async function (db) {
    const oldSs58Prefix = 42;
    return convertTables(db, oldSs58Prefix);
};

exports._meta = {
    "version": 1
};

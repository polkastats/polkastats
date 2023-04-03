'use strict';

var dbm;
var type;
var seed;
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

// Migration script for Account Table
const convertAccountTable = async (db, ss58Format) => {
    const logger = new Logger('account');

    const result = await executeDbRunSqlAsPromise(db, 'SELECT account_id, balances, identity from account;');
    const rows = result.rows;
    logger.setTotalRows(rows.length);

    for (let i = 0; i < rows.length; i++) {
        const {account_id, balances, identity} = rows[i];

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

        await executeDbRunSqlAsPromise(db, queryString);

        logger.log();
    }
}

// Migration script for featured, era_commission, era_points, era_relative_performance, era_self_stake, era_vrc_score tables
const convertEraTables = async (db, ss58Format) => {
    const tables = [
        'featured',
        'era_commission',
        'era_points',
        'era_relative_performance',
        'era_self_stake',
        'era_vrc_score',
    ];

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];

        const logger = new Logger(table);

        const result = await executeDbRunSqlAsPromise(db, `SELECT DISTINCT stash_address from ${table}`);
        const rows = result.rows;
        logger.setTotalRows(rows.length);

        for (let j = 0; j < rows.length; j++) {
            const {stash_address} = rows[j];

            const nextAddress = decode(stash_address, ss58Format)

            const queryString = `UPDATE ${table} SET stash_address='${nextAddress}' WHERE stash_address='${stash_address}';`

            await executeDbRunSqlAsPromise(db, queryString);

            logger.log();
        }
    }
};

const convertRankingTable = async (db, ss58Format) => {
    const logger = new Logger('ranking');

    const result = await executeDbRunSqlAsPromise(db, 'SELECT identity, stash_address, controller_address, rank from ranking;');
    const rows = result.rows;
    logger.setTotalRows(rows.length);

    for (let i = 0; i < rows.length; i++) {
        const {identity, stash_address, controller_address, rank} = rows[i];

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

        await executeDbRunSqlAsPromise(db, queryString);

        logger.log();
    }
}

const convertFaucetTable = async (db, ss58Format) => {
    const logger = new Logger('faucet');

    const result = await executeDbRunSqlAsPromise(db, 'SELECT id, sender, destination from faucet;');
    const rows = result.rows;
    logger.setTotalRows(rows.length);

    for (let i = 0; i < rows.length; i++) {
        const {id, sender, destination} = rows[i];

        const nextSender = decode(sender, ss58Format);

        const nextDestination = decode(destination, ss58Format);

        const queryString = `UPDATE faucet SET sender='${nextSender}', destination='${nextDestination}' WHERE id='${id}';`

        await executeDbRunSqlAsPromise(db, queryString);

        logger.log();
    }
}

// Transfers are a part of extrinsics table
const convertTransfers = async (db, ss58Format) => {
    const logger = new Logger('transfer');

    const result = await executeDbRunSqlAsPromise(db, `select block_number, signer, args, method from extrinsic where method like 'transfer%'`);
    const rows = result.rows;
    logger.setTotalRows(rows.length);

    for (let i = 0; i < rows.length; i++) {
        const {block_number, signer, args, method} = rows[i];

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

        await executeDbRunSqlAsPromise(db, queryString);

        logger.log();
    }
};

const convertTables = async (db, prefix) => {
    await convertAccountTable(db, prefix);
    await convertEraTables(db, prefix);
    await convertRankingTable(db, prefix);
    await convertFaucetTable(db, prefix);
    await convertTransfers(db, prefix);
}

exports.up = async function (db) {
    return convertTables(db, SS58_PREFIX_NEW);
};

exports.down = async function (db) {
    return convertTables(db, SS58_PREFIX_OLD);
};

exports._meta = {
    "version": 1
};

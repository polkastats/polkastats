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

exports.up = function (db) {
    console.log(`Start for second priority data migration ${db} ${SS58_PREFIX_NEW}`);
};

exports.down = function (db) {
};

exports._meta = {
    "version": 1
};

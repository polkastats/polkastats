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
  decodeAddress,
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

const migrateBlockTable = async (db, ss58Format) => {
  console.log('Start migration for Block table');

  const result = await executeDbRunSqlAsPromise(db, `SELECT DISTINCT block_author FROM block WHERE block_author LIKE '5%'`);

  console.log(`Selected ${result.rowCount} accounts from block table`);

  for (const row of result.rows) {
    const { block_author } = row;
    await migrateBlockAuthor(db, ss58Format, block_author);
  }

  console.log('✅ Finished migration for Block table');
};

const migrateBlockAuthor = async (db, ss58Format, block_author) => {
  console.log(`Start migration for ${block_author}`);

  const nextAddress = decodeAddress(block_author, ss58Format);
  if (nextAddress === block_author) {
    console.log(`Skipped migration for ${block_author}`);
    return;
  }

  await executeDbRunSqlAsPromise(db, `UPDATE block SET block_author='${nextAddress}' WHERE block_author='${block_author}'`);

  console.log(`Finished migration for ${block_author}`);
};

exports.up = function (db) {
  return migrateBlockTable(db, SS58_PREFIX_NEW);
};

exports.down = function (db) {
  return migrateBlockTable(db, SS58_PREFIX_OLD);
};

exports._meta = {
  "version": 1
};

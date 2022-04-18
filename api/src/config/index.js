const { blockchains } = require('./blockchains');
const cereTypes = require('./cereTypes');

module.exports = {
  cereTypes, 
  blockchains,
  cacheIntervalMs: process.env.CACHE_UPDATE_INTERVAL_MS || 10 * 60 * 1000
};

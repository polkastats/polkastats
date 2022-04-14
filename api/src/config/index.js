const { blockchains } = require('./blockchains');
const cereTypes = require('./cereTypes');

module.exports = { 
  cereTypes, 
  blockchains,
  cacheIntervalMs: 10 * 60 * 1000
};

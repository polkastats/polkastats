const prom = require('prom-client');
const { decimals } = require('../config/blockchains');
const cacheService = require('./cacheService');
const { convertSmallToBigCoins } = require('../lib/utils')

const accountBalancesMetric = new prom.Gauge({
  name: 'accounts_balances',
  help: 'internal accounts balances amount',
  labelNames: ['blockchain', 'network', 'name', 'address', 'tokenSymbol', 'group'],
});

module.exports = {
  getAll: async (req, res) => {
    const accounts = cacheService.getAccounts();
    accounts.forEach(account => {
      const { blockchain , network, name, address, tokenSymbol, group, balance } = account;
      accountBalancesMetric
        .labels({ blockchain, network, name, address, tokenSymbol, group })
        .set(+convertSmallToBigCoins(balance, decimals[blockchain]));
    });
    res.set('Content-Type', prom.register.contentType);
    res.end(await prom.register.metrics());
  },
};
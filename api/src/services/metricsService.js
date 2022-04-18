const prom = require('prom-client');
const { decimals } = require('../config/blockchains');
const cacheService = require('./cacheService');
const { convertDecimalsToCoins } = require('../lib/utils')

const accountsBalancesMetric = new prom.Gauge({
  name: 'accounts_balances',
  help: 'accounts balances amount',
  labelNames: ['blockchain', 'network', 'name', 'address', 'tokenSymbol', 'group'],
});

module.exports = {
  getAll: async (req, res) => {
    const accounts = cacheService.getAccounts();
    accounts.forEach(account => {
      const { blockchain , network, name, address, tokenSymbol, group, balance } = account;
      accountsBalancesMetric
        .labels({ blockchain, network, name, address, tokenSymbol, group })
        .set(+convertDecimalsToCoins(balance, decimals.CERE));
    });
    res.set('Content-Type', prom.register.contentType);
    res.end(await prom.register.metrics());
  },
};
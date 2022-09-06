const prom = require('prom-client');
const { decimals } = require('../config/blockchains');
const cacheService = require('./cacheService');
const { toFloat } = require('../lib/utils')

const accountsBalancesMetric = new prom.Gauge({
  name: 'blockchains_accounts_balances',
  help: 'blockchains accounts balances from Cere Stats',
  labelNames: ['blockchain', 'network', 'name', 'address', 'tokenSymbol', 'group'],
});

module.exports = {
  getAll: async (req, res, next) => {
    try {
      const accounts = cacheService.getAccounts();
      accounts.forEach(account => {
        const { blockchain , network, name, address, tokenSymbol, group, balance } = account;
        accountsBalancesMetric
          .labels({ blockchain, network, name, address, tokenSymbol, group })
          .set(toFloat(balance, decimals[tokenSymbol]));
      });
      res.set('Content-Type', prom.register.contentType);
      res.end(await prom.register.metrics());
    } catch (err) {
      next(err);
    }    
  },
};
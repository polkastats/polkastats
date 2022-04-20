const { cacheIntervalMs } = require("../config");
const accountsService = require('./accountsService');

let cache = {
  accounts: []
};

module.exports = {
  init: async () => {
    cache.accounts = await accountsService.get();
    console.log('Cache service initialized');

    setInterval(async () => {
      cache.accounts = await accountsService.get();
    }, cacheIntervalMs);
  },
  getAccounts: ()=> cache.accounts
};
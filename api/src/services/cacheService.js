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
      try {
        cache.accounts = await accountsService.get();
      } catch (err) {
        err.message = `Failed to get accounts balances. ${err.message}`;
        console.error(err);
      }
    }, cacheIntervalMs);
  },
  getAccounts: ()=> cache.accounts,
  initialized: ()=> {
    return !!cache.accounts.length;
  }
};
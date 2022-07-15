const { blockchainNames, networkNames, accountGroups } = require('../config/blockchains');
const accountsService = require('./accountsService');

async function checkAccountsBalances(req, res) {  
  try {
    const { query } = req;
    const blockchains = query.blockchains && query.blockchains.split('|');
    const networks = query.networks && query.networks.split('|');
    const groups = query.groups && query.groups.split('|');
    const addresses = query.addresses && query.addresses.split('|');
    
    if (!blockchains) {
      throw new Error('"blockchains" param is required')
    }
    
    const supportedBlockchains = Object.values(blockchainNames);
    blockchains.forEach(blockchain => {
      if(!supportedBlockchains.includes(blockchain)) {
        throw new Error(`Incorrect "blockchains" param value "${blockchain}"`);
      }
    });

    if (networks) {
      const supportedNetworks = Object.values(networkNames);
      networks.forEach(network =>{
        if(!supportedNetworks.includes(network)) {
          throw new Error(`Incorrect "networks" param value "${network}"`);
        }
      });
    }

    if (groups) {
      const supportedGroups = Object.values(accountGroups);
      groups.forEach(group =>{
        if(!supportedGroups.includes(group)) {
          throw new Error(`Incorrect "groups" param value "${group}"`);
        }
      });
    }

    const accounts = await accountsService.get();
    
    if (addresses) {
      addresses.forEach(address => {
        if(!accounts.find(account => account.address === address)) {
          throw new Error(`Address "${address}" doesn't exist`);
        }
      })
    }
    
    let belowMinAccounts = []
    accounts.forEach(account => {
        if(
          blockchains.includes(account.blockchain)
          && (networks? networks.includes(account.network): true)
          && (groups? groups.includes(account.group): true)
          && (addresses? addresses.includes(account.address): true)
          && account.balance.lt(account.minBalance)
        ) {
          belowMinAccounts.push(account);
        }
      });

    if(belowMinAccounts.length) {
      res.json({
        msg: "Some accounts balances below the minimum",
        accounts: belowMinAccounts
      })
    } else {
      res.send({
        msg: "No accounts balances below the minimum",
      });
    }
  } catch (error) {
    res.status(400).json({
      msg: error.message,
    });
  }
}

module.exports = {
  checkAccountsBalances
};
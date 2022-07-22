const { blockchainNames, networkNames, accountGroups } = require('../config/blockchains');
const accountsService = require('./accountsService');

async function checkAccountsBalances(req, res) {  
  try {
    const { query } = req;    
    const blockchains = query.blockchains && query.blockchains.split('|');
    validateBlockchains(blockchains);
    const networks = query.networks && query.networks.split('|');
    validateNetworks(networks);
    const groups = query.groups && query.groups.split('|');
    validateGroups(groups);
    const accounts = await accountsService.get();
    const addresses = query.addresses && query.addresses.split('|');
    validateAddresses(addresses, accounts);
    
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
        msg: "The following accounts have below the minimum balances",
        accounts: belowMinAccounts
      })
    } else {
      res.send({
        msg: "All accounts are good",
      });
    }
  } catch (error) {
    res.status(400).json({
      msg: error.message,
    });
  }
}

function validateBlockchains(blockchains){
  if (!blockchains) {
    throw new Error('"blockchains" param is required')
  }
  
  const supportedBlockchains = Object.values(blockchainNames);
  blockchains.forEach(blockchain => {
    if(!supportedBlockchains.includes(blockchain)) {
      throw new Error(`Incorrect "blockchains" param value "${blockchain}"`);
    }
  });
}

function validateNetworks(networks){
  if (networks) {
    const supportedNetworks = Object.values(networkNames);
    networks.forEach(network =>{
      if(!supportedNetworks.includes(network)) {
        throw new Error(`Incorrect "networks" param value "${network}"`);
      }
    });
  }
}

function validateGroups(groups) {
  if (groups) {
    const supportedGroups = Object.values(accountGroups);
    groups.forEach(group =>{
      if(!supportedGroups.includes(group)) {
        throw new Error(`Incorrect "groups" param value "${group}"`);
      }
    });
  }
}

function validateAddresses(addresses, accounts) {
  if (addresses) {
    addresses.forEach(address => {
      if(!accounts.find(account => account.address === address)) {
        throw new Error(`Address "${address}" doesn't exist`);
      }
    })
  }
}

module.exports = {
  checkAccountsBalances
};
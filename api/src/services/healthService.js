const { blockchainNames, networkNames, accountGroups, decimals } = require('../config/blockchains');
const cacheService = require('./cacheService');
const cereNetworkService = require('./cereNetworkService');
const ethNetworkService = require('./ethNetworkService');
const getClient = require('../../db/db');
const { toFloat } = require("../lib/utils");
const SEPARATOR = ',';

async function checkAccountsBalances(req, res) {
  const { query } = req;
  let accounts;
  let blockchains;
  let networks;
  let groups;
  let addresses;  

  try {
    blockchains = splitParams(query.blockchains);
    validateBlockchains(blockchains);
    networks = splitParams(query.networks);
    validateNetworksNames(networks);
    groups = splitParams(query.groups);
    validateGroups(groups);
    accounts = cacheService.getAccounts();
    addresses = splitParams(query.addresses);
    validateAddresses(addresses, accounts);
  } catch (error) {
    return res.status(400).json({
      msg: error.message,
    });
  }
    
  let errors = [];
  let validatedAccountsNumber = 0;
  accounts.forEach(account => {
    if (
      blockchains.includes(account.blockchain)
      && (networks? networks.includes(account.network): true)
      && (groups? groups.includes(account.group): true)
      && (addresses? addresses.includes(account.address): true)
    ) {
      ++validatedAccountsNumber;
      if (account.balance.lt(account.minBalance)) {
        let accountBalance = toFloat(account.balance, decimals[account.tokenSymbol]);
        let accountMinBalance = toFloat(account.minBalance, decimals[account.tokenSymbol]);
        errors.push(`${account.blockchain}:${account.network} account ${account.address} has balance ${accountBalance} ${account.tokenSymbol} below the ${accountMinBalance} ${account.tokenSymbol} threshold`)
      }      
    }
  });

  res.json(errors.length ? { errors } : { msg: `Validated ${validatedAccountsNumber} account(s)` });
}

function validateBlockchains(blockchains) {
  if (!blockchains) {
    throw new Error('"blockchains" param is required')
  }
  
  const supportedBlockchains = Object.values(blockchainNames);
  blockchains.forEach(blockchain => {
    if (!supportedBlockchains.includes(blockchain)) {
      throw new Error(`Incorrect "blockchains" param value "${blockchain}"`);
    }
  });
}

function validateNetworksNames(networks){
  if (networks) {
    const supportedNetworks = Object.values(networkNames);
    networks.forEach(network => {
      if (!supportedNetworks.includes(network)) {
        throw new Error(`Incorrect "networks" param value "${network}"`);
      }
    });
  }
}

function validateGroups(groups) {
  if (groups) {
    const supportedGroups = Object.values(accountGroups);
    groups.forEach(group => {
      if (!supportedGroups.includes(group)) {
        throw new Error(`Incorrect "groups" param value "${group}"`);
      }
    });
  }
}

function validateAddresses(addresses, accounts) {
  if (addresses) {
    addresses.forEach(address => {
      if (!accounts.find(account => account.address === address)) {
        throw new Error(`Address "${address}" doesn't exist`);
      }
    })
  }
}

function validateNoEmptyFields(fields) {
  for (var name in fields) {
    if (!fields[name] || !fields[name].length) {
      throw new Error(`Field "${name}" is empty`);
    }
  }  
}

function splitParams(params) {
  return params && params.split(SEPARATOR)
}

async function liveness(req, res) {
  res.status(200).json({
    msg: 'Liveness probe is ok',
  });
}

async function readiness(req, res) {
  let errors = [];
  
    let client;
    try {
      client = await getClient();      
    } catch (error) {
      console.error(error);
      errors.push(`Unable to connect to database:${err.message}`);
    } finally {
      client?.end();
    }
  
    if (!cacheService.initialized()) {
      errors.push('Cache service is not initialized yet');
    }
  
    if (!cereNetworkService.initialized()) {
      errors.push('Cere network service is not initialized yet');
    }
  
    if (!ethNetworkService.initialized()) {
      errors.push('Ethereum network service is not initialized yet');
    }
    
    errors.length
      ? res.status(503).json({msg: errors})
      : res.status(200).json({msg: 'Readiness probe is ok'});
}

async function checkBlockchainHealth(req, res) {
    const { query } = req;
    const networks = splitParams(query.networks);
    let errors = [];
    
    try {
      validateNoEmptyFields({networks});
      validateNetworksNames(networks);
    } catch (error) {
      return res.status(400).json({
        msg: error.message,
      });
    }

    await Promise.all(networks.map(async network => {
      try {
        await cereNetworkService.getHealth(network);
      } catch (error) {
        console.error(error);
        errors.push(`Unable to connect to ${network} network`);
      }
    }));

    res.status(200).json(errors.length ? { errors } : { msg: `${networks.join(',')} status is ok`});
}

async function checkBlockchainBlocksFinalization(req, res) {
  const { query } = req;
  const networks = splitParams(query.networks);
  const cereConfig = blockchains.find(blockchain => blockchain.name === blockchainNames.CERE);
  let errors = [];

  try {
    validateNoEmptyFields({networks});
    validateNetworksNames(networks);
  } catch (error) {
    return res.status(400).json({
      msg: error.message,
    });
  }
  
  await Promise.all(
    networks.map(async network => {      
      const [best, finalized] = await Promise.all([
        cereNetworkService.getFinalizedBlock(network),
        cereNetworkService.getBestBlock(network)
      ]);      
      const bestBlockNumberDiff = best - finalized;
      if (bestBlockNumberDiff > cereConfig.bestBlockNumberDiff) {
        errors.push(`Network ${network} has ineffective best block finalization difference number: ${bestBlockNumberDiff}`);
      }
    })
  );

  res.status(200).json(errors.length ? { errors } : { msg: `${networks.join(',')} best block finalization difference number is ok`});
}

async function checkBlockchainBlocksProducing(req, res) {
  const { query } = req;
  const networks = splitParams(query.networks);
  const cereConfig = blockchains.find(blockchain => blockchain.name === blockchainNames.CERE);
  let errors = [];

  try {
    validateNoEmptyFields({networks});
    validateNetworksNames(networks);
  } catch (error) {
    return res.status(400).json({
      msg: error.message,
    });
  }
  
  await Promise.all(
    networks.map(async network => {
      const { block } = await cereNetworkService.getLatestBlock(network);
      const [previousTime, lastTime] = await Promise.all([
        cereNetworkService.getBlockTime(network, block.header.number - 1),
        cereNetworkService.getBlockTime(network, block.header.number),
      ]);
      const timeDiff = lastTime - previousTime;
      if (timeDiff > cereConfig.blockTimeDiffMs) {
        errors.push(`Network ${network} has ineffective block production time difference: ${timeDiff}`);
      }
    })
  );

  res.status(200).json(errors.length ? { errors } : { msg: `${networks.join(',')} block production time difference is ok`});
}

module.exports = {
  liveness,
  readiness,
  checkAccountsBalances,
  checkBlockchainHealth,
  checkBlockchainBlocksFinalization,
  checkBlockchainBlocksProducing,
};
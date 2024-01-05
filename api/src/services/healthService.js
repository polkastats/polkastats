const { blockchains, blockchainNames, networkNames, accountGroups, decimals } = require('../config/blockchains');
const cacheService = require('./cacheService');
const cereNetworkService = require('./cereNetworkService');
const ethNetworkService = require('./ethNetworkService');
const getClient = require('../../db/db');
const { toFloat } = require("../lib/utils");
const SEPARATOR = ',';

async function checkAccountsBalances(req, res, next) {
  try {
    const { query } = req;
    const blockchains = splitParams(query.blockchains);
    const networks = splitParams(query.networks);
    const groups = splitParams(query.groups);
    const addresses = splitParams(query.addresses);
    const accounts = cacheService.getAccounts();
    
    let validationErrors = [
      ...validateBlockchains(blockchains),
      ...validateNetworks(networks),
      ...validateGroups(groups),
      ...validateAddresses(addresses, accounts)
    ];

    if (validationErrors.length) {
      return res.status(400).json({ 
        msg: 'Validation failed', 
        errors: validationErrors 
      });
    }
      
    let healthErrors = [];
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
          healthErrors.push(`${account.blockchain}:${account.network} account ${account.address} has balance ${accountBalance} ${account.tokenSymbol} below the ${accountMinBalance} ${account.tokenSymbol} threshold`)
        }
      }
    });

    res.json(
      healthErrors.length
        ? { msg: 'Health check failed', errors: healthErrors }
        : { msg: `Validated ${validatedAccountsNumber} account(s)` }
    );
  } catch (err) {
    next(err)
  }
}

async function liveness(req, res) {
  res.status(200).json({
    msg: 'Liveness probe is ok',
  });
}

async function readiness(req, res, next) {
  try {
    let healthErrors = [];
    let client;
    try {
      client = await getClient();
    } catch (error) {
      console.error(error);
      healthErrors.push(`Unable to connect to database:${err.message}`);
    } finally {
      client?.end();
    }

    if (!cacheService.initialized()) {
      healthErrors.push('Cache service is not initialized yet');
    }

    if (!cereNetworkService.initialized()) {
      healthErrors.push('Cere network service is not initialized yet');
    }

    if (!ethNetworkService.initialized()) {
      healthErrors.push('Ethereum network service is not initialized yet');
    }
    
    healthErrors.length
      ? res.status(503).json({ msg: 'Readiness probe failed', errors: healthErrors })
      : res.status(200).json({ msg: 'Readiness probe is ok' });  
  } catch (err) {
    next(err)
  }
}

async function checkBlockchainHealth(req, res, next) {
  try {
    const { query } = req;
    let networks = splitParams(query.networks);
    
    const validationErrors = validateNetworks(networks);
    if (validationErrors.length) {
      return res.status(400).json({
        msg: 'Validation failed',
        errors: validationErrors
      });
    }

    let healthErrors = [];
    await Promise.all(networks.map(async network => {
      try {
        await cereNetworkService.getHealth(network);
      } catch (error) {
        console.error(error);
        healthErrors.push(`Unable to connect to ${network} network`);
      }
    }));

    res.status(200).json(
      healthErrors.length
        ? { msg: 'Health check failed', errors: healthErrors }
        : { msg: `${networks.join(',')} status is ok`}
    );
  } catch (err) {
    next(err);
  }
}

async function checkBlockchainBlocksFinalization(req, res, next) {
  try {
    const { query } = req;
    let networks = splitParams(query.networks);
    const cereConfig = blockchains.find(blockchain => blockchain.name === blockchainNames.CERE);
    
    const validationErrors = validateNetworks(networks);
    if (validationErrors.length) {
      return res.status(400).json({
        msg: 'Validation failed',
        errors: validationErrors
      });
    }
    
    let healthErrors = [];
    await Promise.all(
      networks.map(async network => {      
        try {
          const [best, finalized] = await Promise.all([
            cereNetworkService.getFinalizedBlock(network),
            cereNetworkService.getBestBlock(network)
          ]);
          const bestBlockNumberDiff = best - finalized;
          if (bestBlockNumberDiff > cereConfig.bestBlockNumberDiff) {
            healthErrors.push(`${network} network best block finalization difference number ${bestBlockNumberDiff} below the ${cereConfig.bestBlockNumberDiff} threshold`);
          }
        } catch (error) {
          console.error(error);
          healthErrors.push(`Unable to connect to ${network} network`);
        }
      })
    );

    res.status(200).json(
      healthErrors.length 
        ? { msg: 'Health check failed', errors: healthErrors }  
        : { msg: `${networks.join(',')} best block finalization difference number is ok`}
    );
  } catch (err) {
    next(err);
  }
}

async function checkBlockchainBlocksProducing(req, res, next) {
  try {
    const { query } = req;
    let networks = splitParams(query.networks);
    const cereConfig = blockchains.find(blockchain => blockchain.name === blockchainNames.CERE);
    
    const validationErrors = validateNetworks(networks);
    if (validationErrors.length) {
      return res.status(400).json({
        msg: 'Validation failed',
        errors: validationErrors
      });
    }  
    
    let healthErrors = [];
    await Promise.all(
      networks.map(async network => {
        try {
          const { block } = await cereNetworkService.getLatestBlock(network);
          const [previousTime, lastTime] = await Promise.all([
            cereNetworkService.getBlockTime(network, block.header.number - 1),
            cereNetworkService.getBlockTime(network, block.header.number),
          ]);
          const timeDiff = lastTime - previousTime;
          if (timeDiff > cereConfig.blockTimeDiffMs) {
            healthErrors.push(`${network} network block production time difference ${timeDiff}ms below the ${cereConfig.blockTimeDiffMs}ms threshold`);
          }
        } catch (error) {
          console.error(error);
          healthErrors.push(`Unable to connect to ${network} network`);
        }
      })
    );

    res.status(200).json(
      healthErrors.length
        ? { msg: 'Health check failed', errors: healthErrors }
        : { msg: `${networks.join(',')} block production time difference is ok`}
    );
  } catch (err) {
    next(err);
  }
}

function validateBlockchains(blockchains) {
  let errors = []
  
  if (!blockchains) {
    errors.push('"blockchains" param is required');
    return errors;
  }
  
  const supportedBlockchains = Object.values(blockchainNames);
  blockchains.forEach(blockchain => {
    if (!supportedBlockchains.includes(blockchain)) {
      errors.push(`Incorrect "blockchains" param value "${blockchain}"`);
    }
  });
  return errors
}

function validateNetworks(networks) {
  let errors = [];

  if (!networks) {
    errors.push('"networks" param is required');
    return errors;
  }

  if (networks && networks.length) {
    const supportedNetworks = Object.values(networkNames);    
    networks.forEach(network => {
      if (!supportedNetworks.includes(network)) {
        errors.push(`Incorrect "networks" param value "${network}"`);
      }
    });
  }
  return errors;
}

function validateGroups(groups) {
  let errors = []
  if (groups) {
    const supportedGroups = Object.values(accountGroups);    
    groups.forEach(group => {
      if (!supportedGroups.includes(group)) {
        errors.push(`Incorrect "groups" param value "${group}"`);
      }
    });    
  }
  return errors;
}

function validateAddresses(addresses, accounts) {
  let errors = [];
  if (addresses) {    
    addresses.forEach(address => {
      if (!accounts.find(account => account.address === address)) {
        errors.push(`Address "${address}" doesn't exist`);
      }
    })    
  }
  return errors;
}

function splitParams(params) {
  return params && params.split(SEPARATOR)
}

module.exports = {
  liveness,
  readiness,
  checkAccountsBalances,
  checkBlockchainHealth,
  checkBlockchainBlocksFinalization,
  checkBlockchainBlocksProducing,
};

"pallet-chainbridge/try-runtime",
"pallet-ddc-clusters/try-runtime",
"pallet-ddc-customers/try-runtime",
"pallet-ddc-nodes/try-runtime",
"pallet-ddc-payouts/try-runtime",
"pallet-ddc-staking/try-runtime",
"pallet-erc20/try-runtime",
"pallet-erc721/try-runtime",
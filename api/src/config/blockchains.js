const web3 = require('web3');
const { BN } = web3.utils;

const blockchainNames = {
  CERE: 'CERE',
  ETHEREUM: 'ETHEREUM',
  POLYGON: 'POLYGON',
}

const networkNames = {
  DEVNET: 'DEVNET',
  TESTNET: 'TESTNET',
  QANET: 'QANET',
  MAINNET: 'MAINNET'
}

const tokenTypes = {
  ERC20: 'ERC20',
  NATIVE: 'NATIVE'
}

const tokenSymbols = {
  CERE: 'CERE',
  ETH: 'ETH',
  MATIC: 'MATIC',
  USDC: 'USDC'
}

const accountGroups = {
  DDC: 'DDC',
  BRIDGE: 'BRIDGE',
  BRIDGE_RELAYERS: 'BRIDGE_RELAYERS',
  DAVINCI: 'DAVINCI',
  STATS: 'STATS',
  LIVEONE: 'LIVEONE'
}

const decimals = {}
decimals[tokenSymbols.CERE] = new BN(10);
decimals[tokenSymbols.MATIC] = new BN(18);
decimals[tokenSymbols.ETH] = new BN(18);
decimals[tokenSymbols.USDC] = new BN(6);

let blockchains = JSON.parse(process.env.BLOCKCHAINS);

// Deprecated config from NETWORKS variable
// ToDo remove it later
const networks = JSON.parse(`[${process.env.NETWORKS}]`);
const cereDevnet = networks.find(network => network.NETWORK === networkNames.DEVNET);
const cereQanet = networks.find(network => network.NETWORK === networkNames.QANET);
const cereTestnet = networks.find(network => network.NETWORK === networkNames.TESTNET);

blockchains.forEach(blockchain => {
  blockchain.networks.forEach(network => {
    if (blockchain.name === blockchainNames.CERE) {
      switch(network.name) {
        case networkNames.DEVNET:
          network.faucetMnemonic = cereDevnet.MNEMONICS;
          network.rpcUrl = cereDevnet.URL;
          break;
        case networkNames.QANET:
          network.faucetMnemonic = cereQanet.MNEMONICS;
          network.rpcUrl = cereQanet.URL;
          break;
        case networkNames.TESTNET:
          network.faucetMnemonic = cereTestnet.MNEMONICS;
          network.rpcUrl = cereTestnet.URL;
          break;
          //there is no case for MAINNET as we don't support faucet for it
        default:
          console.warn(`Network "${network.name}" is not supported`);
      }
    }

    network.accounts && network.accounts.forEach(account => {
      if (!account.type) account.type = tokenTypes.NATIVE;
      if (!account.tokenSymbol) account.tokenSymbol = blockchain.nativeTokenSymbol;
    });
  });
});

module.exports = { blockchainNames, tokenSymbols, tokenTypes, accountGroups, networkNames, decimals, blockchains }

const web3 = require('web3');
const { BN } = web3.utils;
const { blockchains } = require("../config");
const { blockchainNames, networkNames, decimals } = require("../config/blockchains");
const cereNetworkService = require('./cereNetworkService');
const ethNetworkService = require('./ethNetworkService');
const { ETHEREUM_CERE_LOCKED_ADDRESSES } = process.env;

async function getTotalSupplyInternal(network) {
  const totalSupply = await cereNetworkService.getTotalSupply(network);
  const base = new BN(10);
  return totalSupply.div(base.pow(decimals.CERE));
}

module.exports = {
  getTotalSupply: async (req, res) => {
    const totalSupply = await getTotalSupplyInternal(networkNames.MAINNET);
    res.json(totalSupply);
  },
  getCirculatingSupply: async (req, res) => {
    const totalSupply = await getTotalSupplyInternal(networkNames.MAINNET);
    let circulatingSupply = totalSupply;
    const ethereumCERELockedAddresses = JSON.parse(ETHEREUM_CERE_LOCKED_ADDRESSES);    
    const { cereTokenContractAddress } = 
      blockchains.find(blockchain => blockchain.name === blockchainNames.POLYGON)
        .networks.find(network => network.name === networkNames.MAINNET);
    for (let i = 0; i < ethereumCERELockedAddresses.length; i++) {
      const balance = await ethNetworkService.getErc20Balance({
        blockchain: blockchainNames.POLYGON,
        network: networkNames.MAINNET,
        erc20TokenAddress: cereTokenContractAddress,
        address: ethereumCERELockedAddresses[i]
      });
      circulatingSupply = circulatingSupply.sub(balance);
    }
    res.json(circulatingSupply);
  },
};

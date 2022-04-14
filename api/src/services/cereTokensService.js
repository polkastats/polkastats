const { blockchainNames, networkNames, decimals } = require("../config/blockchains");
const cereNetworkService = require('./cereNetworkService');
const ethNetworkService = require('./ethNetworkService');
const { ETHEREUM_CERE_LOCKED_ADDRESSES } = process.env;

async function getTotalSupplyInternal(network) {
  const totalSupply = await cereNetworkService.getTotalSupply(network);
  return +totalSupply / 10 ** decimals[blockchainNames.CERE];
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
    for (let i = 0; i < ethereumCERELockedAddresses.length; i++) {
      const balance = await ethNetworkService.getCEREBalanceOf(blockchainNames.POLYGON, networkNames.MAINNET, ethereumCERELockedAddresses[i]);
      circulatingSupply -= balance;
    }
    res.json(circulatingSupply);
  },
};

const { decimal } = require("../constants/config");
const cereNetworkService = require('./cereNetworkService');
const ethNetworkService = require('./ethNetworkService');

const ethereumCERELockedAddresses = ["0x88E3386AC317892782f346e65FA7a4dd893552a1", "0x367ebF942F75E0c7Cf3EC0CEe1017349EDb3368b",
  "0x367ebF942F75E0c7Cf3EC0CEe1017349EDb3368b", "0x4F700F658E5D87aeC7D42915952AbD570Dc7a3a7", "0xb4f5427885c26841A7748Fc99045fbFaA02BfF4C",
  "0x4a3406bEEdBA323497cb0b78c9b8273025D6Ca2c", "0x2B2673Bfd41260FF4FA3aD4389F0aF073417bF53", "0x91F5f7d8A486ee532abf02E889690A639C770B3c",
  "0xd48B20754126dAD38DC7062303aB9b0572f9De7F", "0x28D6C0A4247ff359cc43fD14E9326EbF030AD34C", "0xEA1E345F7b3dd12cA24461F839F0083c3A547337",
  "0xe96625d91998c1954CF7C10911c4BF28d3e10107", "0x844195Bba29D9087b85ba4AC8eF51be69c91Ee8C", "0x6D5185fa0e358d22250aE689800E7a57d47a7e3f",
  "0x7764eD13EaE5BC5e440D4eb07ef5Ef4A5F7C8807", "0x1220dD9E425FD567076C91Cf3347800f34200CE7", "0x865a05cd1F4A501EF482506F4C4809beD8602480",
  "0x4E764087B5b9F7C7F4b4009FdEd2d2d5D042A89A", "0x72B4130e230d0E8F6694C7851303F5c8f90F676f", "0x66154232a55bce60c1945c0f5347A1EB4faFc420",
  "0xAC114DA1B620FeD209bA4a11D46Dfb6A17641825", "0x15b363ceb7688a727b8406aed009d70f7704cd34"];

async function getTotalSupplyInternal(network) {
  const totalSupply = await cereNetworkService.getTotalSupply(network);
  return +totalSupply / 10 ** decimal;
}

module.exports = {
  getTotalSupply: async (req, res) => {
    const totalSupply = await getTotalSupplyInternal('MAINNET');
    res.json(totalSupply);
  },
  getCirculatingSupply: async (req, res) => {
    const totalSupply = await getTotalSupplyInternal('MAINNET');
    let circulatingSupply = totalSupply;
    for (let i = 0; i < ethereumCERELockedAddresses.length; i++) {
      const balance = await ethNetworkService.getCEREBalanceOf(ethereumCERELockedAddresses[i]);
      circulatingSupply -= balance;
    }
    res.json(circulatingSupply);
  },
};

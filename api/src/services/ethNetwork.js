const Web3 = require('web3');
const { HTTP_ETH_PROVIDER, CERE_TOKEN_CONTRACT_ADDRESS } = process.env;
const web3 = new Web3(new Web3.providers.HttpProvider(HTTP_ETH_PROVIDER));
const cereTokenAbi = require('../contracts/cereTokenAbi.json');
const { decimal } = require("../constants/config");
const contract = new web3.eth.Contract(
  cereTokenAbi,
  CERE_TOKEN_CONTRACT_ADDRESS
);

module.exports = {
  getCereTotalSupply: async(req, res) => {
    const totalSupply = await contract.methods.totalSupply().call();
    const result = +totalSupply / 10 ** decimal;
    res.json(result);
  },
  getCereTotalCirculatingSupply: (req, res) => {
    res.json(68900000);
  }
}
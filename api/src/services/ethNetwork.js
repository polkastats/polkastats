const Web3 = require('web3');
const { HTTP_ETH_PROVIDER } = process.env;
const web3 = new Web3(new Web3.providers.HttpProvider(HTTP_ETH_PROVIDER));
const cereErc20Abi = require('../constants/cereErc20Abi.json');
const { decimal, CereTokenContractAddress } = require("../constants/config");
const contract = new web3.eth.Contract(cereErc20Abi, CereTokenContractAddress);

module.exports = {
  getCereTotalSupply: async() => {
    const totalSupply = await contract.methods.totalSupply().call();
    return +totalSupply / 10 ** decimal;
  }
}
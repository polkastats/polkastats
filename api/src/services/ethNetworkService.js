const Web3 = require('web3');
const { ETHEREUM_HTTP_PROVIDER_URL, ETHEREUM_CERE_TOKEN_CONTRACT_ADDRESS } = process.env;
const web3 = new Web3(new Web3.providers.HttpProvider(ETHEREUM_HTTP_PROVIDER_URL));
const erc20TokenAbi = require('./../contracts/erc20TokenAbi.json');
const { decimal } = require("./../constants/config");
const contract = new web3.eth.Contract(
  erc20TokenAbi,
  ETHEREUM_CERE_TOKEN_CONTRACT_ADDRESS
);

module.exports = {
  getCEREBalanceOf: async (address) => {
    const balance = await contract.methods.balanceOf(address).call();
    return +balance / 10 ** decimal;
  }
};

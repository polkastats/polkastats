const Web3 = require('web3');
const { BN } = Web3.utils;
const { blockchains } = require("../config");
const erc20TokenAbi = require("../config/contracts/erc20TokenAbi.json");
const { blockchainNames } = require("../config/blockchains");
const networkParams = new Map();
let initialized = false;

async function init() {
  const promises = [];
  const polygon = blockchains.find(blockchain => blockchain.name === blockchainNames.POLYGON);
  const ethereum = blockchains.find(blockchain => blockchain.name === blockchainNames.ETHEREUM);
  [polygon, ethereum].forEach(blockchain => {
    blockchain.networks.forEach(network => {
      const { rpcUrl } = network;
      const promise = async() => ({
        blockchain: blockchain.name,
        name: network.name,
        rpc: await initNetwork(rpcUrl)
      });
      promises.push(promise());
    });
  });
  const res = await Promise.all(promises);  
  res.forEach(network => {
    const providerId = getProviderId(network.blockchain, network.name);
    networkParams.set(providerId, network.rpc);
  });
  initialized = true;  
}

async function initNetwork(url) {
  return initProvider(url);
}

async function initProvider(url) {
  const provider = new Web3.providers.HttpProvider(url);
  const web3 = new Web3(provider);
  console.log(`Connected to ${url}`);
  return { web3 };
}

function getProviderId(blockchain, network) {
  return  `${blockchain}_${network}`;
}

module.exports = {
  init,
  getBalance: async (blockchain, network, address) => {
    const providerId = getProviderId(blockchain, network);
    const { web3 } = networkParams.get(providerId);
    return new BN(await web3.eth.getBalance(address));
  },
  getErc20Balance: async ({ blockchain, network, erc20TokenAddress, address }) => {
    const providerId = getProviderId(blockchain, network);
    const { web3 } = networkParams.get(providerId);
    const contract = new web3.eth.Contract(
      erc20TokenAbi,
      erc20TokenAddress
    );

    return new BN(await contract.methods.balanceOf(address).call());
  },
  initialized: () => initialized,
};

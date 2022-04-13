const Web3 = require('web3');
const { blockchains } = require("./../constants/config");
const erc20TokenAbi = require("./../constants/contracts/erc20TokenAbi.json");
const { decimals, blockchainNames } = require("./../constants/blockchains");
const networkParams = new Map();

async function init() {
  const promises = [];
  const ethereum = blockchains[1];
  const ethBlockchains = [ethereum];
  ethBlockchains.forEach(ethBlockchain => {
    ethBlockchain.networks.forEach(network => {
      const { rpcUrl, cereTokenContractAddress} = network;
      const promise = async() => ({
        blockchain: ethBlockchain.name,
        name: network.name,
        rpc: await initNetwork(rpcUrl, cereTokenContractAddress)
      });
      promises.push(promise());
    });
  });
  const res = await Promise.all(promises);  
  res.forEach(network => {
    const providerId = getProviderId(network.blockchain, network.name);
    networkParams.set(providerId, network.rpc);
  });  
}

async function initNetwork(url, cereTokenContractAddress) {  
  return initProvider(url, cereTokenContractAddress);
}

async function initProvider(url, cereTokenContractAddress) {
  const provider = new Web3.providers.HttpProvider(url);
  const web3 = new Web3(provider);
  const contract = new web3.eth.Contract(
    erc20TokenAbi,
    cereTokenContractAddress
  );
  console.log(`Connected to ${url}`);
  return { web3, contract };
}

function getProviderId(blockchain, network) {
  return  `${blockchain}_${network}`;
}

init();

module.exports = {
  getCEREBalanceOf: async (blockchain, network, address) => {
    const providerId = getProviderId(blockchain, network);
    const { contract } = networkParams.get(providerId);
    const balance = await contract.methods.balanceOf(address).call();
    return +balance / 10 ** decimals[blockchainNames.CERE];
  },
  getBalance: (blockchain, network, address) => {
    const providerId = getProviderId(blockchain, network);
    const { web3 } = networkParams.get(providerId);
    return web3.eth.getBalance(address)
  },
  getErc20Balance: ({ blockchain, network, erc20TokenAddress, address }) => {
    const providerId = getProviderId(blockchain, network);
    const { web3 } = networkParams.get(providerId);
    // console.log({ address });
    const contract = new web3.eth.Contract(
      erc20TokenAbi,
      erc20TokenAddress
    );
    return contract.methods.balanceOf(address).call().catch(err=> {
      console.error({address})
      throw err;
    });
  }
};

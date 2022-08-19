const { ApiPromise, WsProvider, Keyring } = require("@polkadot/api");
const { cereTypes, blockchains } = require("../config");
const { blockchainNames }  = require("../config/blockchains");
const web3 = require('web3');
const { BN } = web3.utils;

const networkParams = new Map();
let initialized = false;

async function init() {
  const promises = [];
  const cere = blockchains.find(blockchain => blockchain.name === blockchainNames.CERE);
  cere.networks.forEach(network => {
    const promise = async() => ({
      name: network.name,
      rpc: await initNetwork(network.rpcUrl, network.faucetMnemonic)
    });
    promises.push(promise());
  });
  const res = await Promise.all(promises);
  res.forEach(network => {
    networkParams.set(network.name, network.rpc);
  });
  initialized = true;
}

async function initNetwork(url, faucetMnemonic) {
  const api = await initProvider(url);
  if (faucetMnemonic) {
    const faucet = await initFaucet(faucetMnemonic);
    return {api, faucet};
  }
  return {api, faucet: {}};
}

async function initProvider(url) {
  const provider = new WsProvider(url);
  const api = await ApiPromise.create({
    provider,
    types: cereTypes,
  });
  await api.isReady;
  const chain = await api.rpc.system.chain();
  console.log(`Connected to ${chain} at ${url}`);
  return api;
}

function initFaucet(faucetMnemonic) {
  const keyring = new Keyring({ type: "sr25519" });
  const newPair = keyring.addFromUri(faucetMnemonic);
  return newPair;
}

function getBlock(network, blockHash) {
  const { api } = networkParams.get(network.toUpperCase());
  return api.rpc.chain.getBlock(blockHash);
}

function getBlockHash(network, blockNumber) {
  const { api } = networkParams.get(network.toUpperCase());
  return api.rpc.chain.getBlockHash(blockNumber);
}

module.exports = {
  init,
  supportsNetwork: (network) => {
    return networkParams.has(network.toUpperCase());
  },
  getBalance: async (network, address) => {
    const { api, _ } = networkParams.get(network.toUpperCase());
    const { data: balance } = await api.query.system.account(address);
    return new BN(balance.free.toString());
  },
  transferFromFaucet: async (network, address, value) => {
    const { api, faucet } = networkParams.get(network.toUpperCase());
    const { nonce } = await api.query.system.account(faucet.address);
    return new Promise((resolve, reject) => {
      api.tx.balances
        .transfer(address, value)
        .signAndSend(faucet, { nonce }, ({ status }) => {
          if (status.isInBlock) {
            console.log(`Included in ${status.asInBlock}`);
            resolve({ trxHash: status.asInBlock.toHex(), sender: faucet.address });
          } else if (status.isFinalized) {
            console.log(`The transaction is Finalized ${status.asFinalized}`);
          }
        })
        .catch((err) => reject(err));
    });
  },
  getTotalSupply: async (network) => {
    const { api, _ } = networkParams.get(network.toUpperCase());
    return new BN((await api.query.balances.totalIssuance()).toString());
  },
  getHealth: async (network) => {
    const { api } = networkParams.get(network.toUpperCase());
    return api.rpc.system.health();
  },
  getBlock,
  getLatestBlock: async (network) => {
    const { api } = networkParams.get(network.toUpperCase());
    return api.rpc.chain.getBlock();
  },
  getFinalizedBlock: async (network) => {
    const { api } = networkParams.get(network.toUpperCase());
    return Number(await api.derive.chain.bestNumberFinalized());
  },
  getBestBlock: async (network) => {
    const { api } = networkParams.get(network.toUpperCase());
    return Number(await api.derive.chain.bestNumber());
  },
  getBlockHash,
  getBlockTime: async (network, blockNumber) => {
    const blockHash = await getBlockHash(network, blockNumber);
    const { block } = await getBlock(network, blockHash);
    const extrinsic =  block.extrinsics.find((extrinsic) => extrinsic.method.section === 'timestamp');
    return Number(extrinsic.method.args[0]);
  },
  initialized: () => initialized,
};

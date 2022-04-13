const { ApiPromise, WsProvider, Keyring } = require("@polkadot/api");
const { cereTypes, blockchains } = require("../constants/config");
const { NETWORKS } = process.env;

const networkParams = new Map();

async function init() {
  const promises = [];
  const cere = blockchains[0];
  cere.networks.forEach(network => {
    const promise = async() => ({
      name: network.name,
      rpc: await initNetwork(network.rpcUrl, network.mnemonic)
    });
    promises.push(promise());
  });
  const res = await Promise.all(promises);
  res.forEach(network => {
    networkParams.set(network.name, network.rpc);
  });

  // Deprecated: init networks from NETWORKS config
  // ToDo: remove it in the future
  if (NETWORKS === undefined) {
    return true
  }
  const networks = NETWORKS.split("},");
  networks.forEach(async (network, index) => {
    if (index !== networks.length - 1) {
      network = network + '}'
    }
    const parsedNetwork = JSON.parse(network);
    networkParams.set(parsedNetwork.NETWORK, await initNetwork(parsedNetwork.URL, parsedNetwork.MNEMONICS));
  });
}

async function initNetwork(url, mnemonic) {
  const api = await initProvider(url);
  if (mnemonic) {
    const faucet = await initFaucet(mnemonic);
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
  console.log(`Connected to ${chain}`);
  return api;
}

function initFaucet(mnemonic) {
  const keyring = new Keyring({ type: "sr25519" });
  const newPair = keyring.addFromUri(mnemonic);
  return newPair;
}

init();

module.exports = {
  supportsNetwork: (network) => {
    return networkParams.has(network.toUpperCase());
  },
  getBalance: async (network, address) => {
    const { api, _ } = networkParams.get(network.toUpperCase());
    const { nonce, data: balance } = await api.query.system.account(address);
    return balance.free.toString();
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
            resolve(status.asInBlock.toHex());
          } else if (status.isFinalized) {
            console.log(`The transaction is Finalized ${status.asFinalized}`);
          }
        })
        .catch((err) => reject(err));
    });
  },
  getTotalSupply: (network) => {
    const { api, _ } = networkParams.get(network.toUpperCase());
    return api.query.balances.totalIssuance();
  }
};

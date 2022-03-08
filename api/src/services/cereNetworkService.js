const { ApiPromise, WsProvider, Keyring } = require("@polkadot/api");
const { config } = require("../constants/config");
const {
  NETWORKS,
} = process.env;

const networkParams = new Map();

function init() {
  if (NETWORKS === undefined) {
    return true
  }
  const networks = NETWORKS.split("},");

  networks.forEach(async (network, index) => {
    if (index !== networks.length - 1) {
      network = network + '}'
    }
    const parsedNetwork = JSON.parse(network);
    const api = await initProvider(parsedNetwork.URL);
    const faucet = await initFaucet(parsedNetwork.MNEMONICS);
    networkParams.set(parsedNetwork.NETWORK, { api: api, faucet: faucet });
  });
}

async function initProvider(url) {
  console.log(`url is ${url}`);
  const provider = new WsProvider(url);
  const api = await ApiPromise.create({
    provider,
    types: config,
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
    const { api } = networkParams.get(network.toUpperCase());
    const { nonce, data: balance } = await api.query.system.account(address);
    return balance.free;
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

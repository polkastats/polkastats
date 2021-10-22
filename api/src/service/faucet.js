const { ApiPromise, WsProvider, Keyring } = require("@polkadot/api");
// ToDo: https://cerenetwork.atlassian.net/browse/CBI-1533
const {config, decimal} = require("../constants/config");
require("dotenv").config();
const getClient = require("../../db/db");
const {
  NETWORKS,
  NUMBER_OF_TOKENS_TO_SEND,
  MAX_BALANCE,
  REQUEST_PER_DAY,
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

function initFaucet(mnemonic) {
  const keyring = new Keyring({ type: "sr25519" });
  const newPair = keyring.addFromUri(mnemonic);
  return newPair;
}

async function initProvider(url) {
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

async function getBalance(address, api) {
  const { nonce, data: balance } = await api.query.system.account(address);
  return balance.free;
}

async function transfer(address, value, { api, faucet }) {
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
}

init();

module.exports = {
  faucet: async (req, res) => {
    try {
      const { address, network } = req.body;

      // Validate network type
      const isValidNetwork = networkParams.has(network.toUpperCase());
      if (!isValidNetwork) {
        throw new Error("Invalid Network Type");
      }

      const client = await getClient();

      // Count number of transaction happened today.
      const selectQuery = `SELECT COUNT(*) FROM faucet WHERE createdAt::date = now()::date;`;
      const dbresselect = await client.query(selectQuery);
      const todaysTransaction = dbresselect.rows[0].count;

      if (todaysTransaction > +REQUEST_PER_DAY) {
        throw new Error(
          `We exceed our daily limit: ${+REQUEST_PER_DAY}. Try again later.`
        );
      }

      const { api, faucet } = networkParams.get(network.toUpperCase());
      const balance = await getBalance(address, api);
      const value = NUMBER_OF_TOKENS_TO_SEND * 10 ** decimal;
      const maxBalance = MAX_BALANCE * 10 ** decimal;

      // Fetch client IP address
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      // Check for minimum balance
      if (balance >= maxBalance) {
        throw new Error(
          `Your balance is ${balance.toHuman()}, So we couldn't process your request.`
        );
      }

      // Transfer CERE tokens
      const txnHash = (
        await transfer(address, value, { api, faucet })
      ).toString();

      const insertQuery = `
        INSERT INTO faucet (
          sender,
          value,
          txnHash,
          destination,
          network,
          address
        )
        VALUES (
          '${faucet.address}',
          '${value}',
          '${txnHash}',
          '${address}',
          '${network.toUpperCase()}',
          '${ip}'
        )
        ;`;
      await client.query(insertQuery);
      res.status(200).json({ msg: `Your transaction hash is ${txnHash}` });
    } catch (error) {
      console.log(error.message);
      res.status(400).json({
        msg: error.message,
      });
    }
  },
};

// ToDo: https://cerenetwork.atlassian.net/browse/CBI-1533
const web3 = require('web3');
const { BN } = web3.utils;
const { decimals } = require("../config/blockchains");
require("dotenv").config();
const getClient = require("../../db/db");
const {
  NUMBER_OF_TOKENS_TO_SEND,
  MAX_BALANCE,
  REQUESTS_PER_DAY,
} = process.env;
const cereNetworkService = require('./cereNetworkService');

module.exports = {
  faucet: async (req, res) => {
    try {
      const { address, network } = req.body;

      // Validate network type
      if (!cereNetworkService.supportsNetwork(network)) {
        throw new Error("Invalid Network Type.");
      }

      const client = await getClient();

      // Count number of transaction happened today.
      const selectQuery = `SELECT COUNT(*) FROM faucet WHERE createdAt::date = now()::date;`;
      const dbresselect = await client.query(selectQuery);
      const todaysTransaction = dbresselect.rows[0].count;

      if (todaysTransaction > +REQUESTS_PER_DAY) {
        throw new Error(
          `We exceed our daily limit: ${+REQUESTS_PER_DAY}. Try again later.`
        );
      }

      const balance = await cereNetworkService.getBalance(network, address);
      const base = new BN(10);
      const numberOfTokensToSend = new BN(NUMBER_OF_TOKENS_TO_SEND);
      const value = numberOfTokensToSend.mul(base.pow(decimals.CERE));
      const maxBalanceCoins = new BN(MAX_BALANCE)
      const maxBalance =  maxBalanceCoins.mul(base.pow(decimals.CERE));

      // Fetch client IP address
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      // Check for minimum balance
      if (balance.gte(maxBalance)) {
        throw new Error(
          `Your balance is ${balance.toHuman()}, so we couldn't process your request.`
        );
      }

      // Transfer CERE tokens
      const result = await cereNetworkService.transferFromFaucet(network, address, value);

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
          '${result.sender}',
          '${value}',
          '${result.trxHash}',
          '${address}',
          '${network.toUpperCase()}',
          '${ip}'
        )
        ;`;
      await client.query(insertQuery);
      res.status(200).json({ msg: `Your transaction hash is ${result.trxHash}` });
    } catch (error) {
      console.log(error);
      res.status(400).json({
        msg: error.message,
      });
    }
  },
};

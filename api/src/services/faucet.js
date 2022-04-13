// ToDo: https://cerenetwork.atlassian.net/browse/CBI-1533
const { decimals, blockchainNames } = require("../constants/blockchains");
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
      const value = NUMBER_OF_TOKENS_TO_SEND * 10 ** decimals[blockchainNames.CERE];
      const maxBalance = MAX_BALANCE * 10 ** decimals[blockchainNames.CERE];

      // Fetch client IP address
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

      // Check for minimum balance
      if (balance >= maxBalance) {
        throw new Error(
          `Your balance is ${balance.toHuman()}, so we couldn't process your request.`
        );
      }

      // Transfer CERE tokens
      const txnHash = (
        await cereNetworkService.transferFromFaucet(network, address, value)
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

const { decimal } = require("../constants/config");
const cereNetworkService = require('./cereNetworkService');

module.exports = {
  getTotalSupply: async (req, res) => {
    const totalSupply = await cereNetworkService.getTotalSupply('MAINNET');
    const result = +totalSupply / 10 ** decimal;
    res.json(result);
  },
  getCereCirculatingSupply: (req, res) => {
    res.json(68900000);
  },
};

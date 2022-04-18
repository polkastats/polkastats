const { BigNumber } = require('ethers');
const web3 = require('web3');
const { BN } = web3.utils;

function convertDecimalsToCoins (amount, decimals) {
    const base  = new BN(10);
    return amount.div(base.pow(decimals));
}

module.exports = {
    convertDecimalsToCoins,
}
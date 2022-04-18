const web3 = require('web3');
const { BN } = web3.utils;

function convertDecimalsToCoins (amount, decimals) {
    const base  = new BN(10);
    return amount.div(base.pow(decimals));
}

function getTokenFloatAmount(amount, decimals){
    const base = new BN(10);    
    const float = amount.divmod(base.pow(decimals));
    return parseFloat(`${float.div}.${float.mod}`);
} 

module.exports = {
    convertDecimalsToCoins,
    getTokenFloatAmount
}
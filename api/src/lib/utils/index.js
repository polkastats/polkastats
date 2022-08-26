const web3 = require('web3');
const { BN } = web3.utils;
const base = new BN(10);

function toFloat(amount, decimals) {
    const float = amount.divmod(base.pow(decimals));
    return parseFloat(`${float.div}.${float.mod}`);
}

function toBN(amount, decimals) {
    return (new BN(amount)).mul(base.pow(decimals));
}

module.exports = {
    toFloat,
    toBN
}
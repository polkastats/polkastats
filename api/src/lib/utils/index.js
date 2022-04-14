const { BigNumber } = require('ethers');

function convertSmallToBigCoins (smallCoins, decimals) {
    return BigNumber.from(smallCoins).div(
        BigNumber.from(decimals).pow(10)
    ).toString();
}

module.exports = {
    convertSmallToBigCoins,
}
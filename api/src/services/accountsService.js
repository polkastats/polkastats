const { blockchainNames, tokenTypes } = require("../config/blockchains");
const { blockchains } = require("../config");
const cereNetworkService = require('./cereNetworkService');
const ethNetworkService = require('./ethNetworkService');

async function  get() {
  const promises  = [];
  blockchains.forEach(blockchain => {
    blockchain.networks.forEach(network => {
      network.accounts && network.accounts.forEach(account => {
        const promise = async () => {
          let balance;
          switch (blockchain.name) {
            case blockchainNames.CERE:
              switch(account.type) {
                case tokenTypes.NATIVE:
                  balance = await cereNetworkService.getBalance(network.name, account.address);
                  break;
              }
              break;
            case blockchainNames.POLYGON:
            case blockchainNames.ETHEREUM:
              switch(account.type) {
                case tokenTypes.NATIVE:
                  balance = await ethNetworkService.getBalance(blockchain.name, network.name, account.address);
                  break;
                case tokenTypes.ERC20:
                  balance = await ethNetworkService.getErc20Balance({
                    blockchain: blockchain.name,
                    network: network.name,
                    erc20TokenAddress: account.erc20TokenAddress,
                    address: account.address
                  });
                  break;
              }
              break;
            default:
              console.warn("Blockchain doesn't exist");
          }

          return {
            blockchain: blockchain.name,
            network: network.name,
            name: account.name,
            address: account.address,
            tokenSymbol: account.tokenSymbol,
            group: account.group,
            balance
          };
        }
        promises.push(promise());
      });
    });
  });
  
  return Promise.all(promises);
}

module.exports = {
  get
};
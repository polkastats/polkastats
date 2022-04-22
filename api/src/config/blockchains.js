const web3 = require('web3');
const { BN } = web3.utils;

const blockchainNames = {
  CERE: 'CERE',
  ETHEREUM: 'ETHEREUM',
  POLYGON: 'POLYGON',
}

const networkNames = {
  DEVNET: 'DEVNET',
  TESTNET: 'TESTNET',
  QANET: 'QANET',
  MAINNET: 'MAINNET'
}

const tokenTypes = {
  ERC20: 'ERC20',
  NATIVE: 'NATIVE'
}

const tokenSymbols = {
  CERE: 'CERE',
  ETH: 'ETH',
  MATIC: 'MATIC',
  USDC: 'USDC'
}

const accountGroups = {
  DDC: 'DDC',
  BRIDGE: 'BRIDGE',
  BRIDGE_RELAYERS: 'BRIDGE_RELAYERS',
  DAVINCI: 'DAVINCI',
  STATS: 'STATS'
}

const decimals = {}
decimals[tokenSymbols.CERE] = new BN(10);
decimals[tokenSymbols.MATIC] = new BN(18);
decimals[tokenSymbols.ETH] = new BN(18);
decimals[tokenSymbols.USDC] = new BN(6);

let blockchains = (process.env.BLOCKCHAINS && JSON.parse(process.env.BLOCKCHAINS)) || [
  {
    "name": blockchainNames.CERE,
    "nativeTokenSymbol": tokenSymbols.CERE,
    "networks": [
      {
        "name": networkNames.DEVNET,
        "rpcUrl": "wss://rpc.devnet.cere.network:9945",
      },
      {
        "name": networkNames.QANET,
        "rpcUrl": "wss://rpc.qanet.cere.network:9945",
      },
      {
        "name": networkNames.TESTNET,
        "rpcUrl": "wss://rpc.testnet.cere.network:9945",
        "accounts": [
          {
            "address": "5GjivYu4Sb9qNLWp6GYqm5VgPqbYCA2JsePBENAZTdsgqGmn",
            "name": "relayer-0",
            "minBalance": 5,
            "group": accountGroups.BRIDGE_RELAYERS,
          },
          {
            "address": "5FRkUfyFFnmMGMyahCVPph11tLJhSsTgzk3dJz9PHQayjJnV",
            "name": "relayer-1",
            "minBalance": 5,
            "group": accountGroups.BRIDGE_RELAYERS,
          },
          {
            "address": "5DcK9wGDQfdjH75Wu9KWbax25sKp9gAHHABFMaTxzYUMbUax",
            "name": "relayer-2",
            "minBalance": 5,
            "group": accountGroups.BRIDGE_RELAYERS,
          },
          {
            "address": "5EYCAe5g7bGpFHagwe26HiRHdHdE3hobrwV6hq1UD2BPAiZb",
            "name": "bridge",
            "minBalance": 5,
            "group": accountGroups.BRIDGE
          },
          {
            "address": "5HgyguXZNFra3BKQ3yBVHMReuSaK7ZPDKiftq9rgV43vuG9U",
            "name": "faucet",
            "minBalance": 1000,
            "group": accountGroups.STATS
          }
        ]
      },
      {
        "name": networkNames.MAINNET,
        "rpcUrl": "wss://rpc.mainnet.cere.network:9945",
        "accounts": [
          {
            "address": "5DDArkL7BzgQqRSKF4jeaDUi9ezr9UbYYjX6G3dyDM2eA3bi",
            "name": "relayer-0",
            "minBalance": 10,
            "group": accountGroups.BRIDGE_RELAYERS,
          },
          {
            "address": "5DMDToa27GZhHBCS6vr7evgnyz1XJdfb3CZejSPQuTEH1fMZ",
            "name": "relayer-1",
            "minBalance": 10,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "5FPAKxVmwCj4DMnHJmnnWffztwUyvVucbgaGDUaSjcFqKuHe",
            "name": "relayer-2",
            "minBalance": 10,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "5DRzvs36qMwHdHxw1iE4hJMbsrbfqz9DpDNd52wqyBQcRgwh",
            "name": "relayer-3",
            "minBalance": 10,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "5EYCAe5g7bGpFHagwe26HiRHdHdE3hobrwV6hq1UD2BPAiZb",
            "name": "bridge",
            "minBalance": 10000000,
            "group": accountGroups.BRIDGE
          },
          {
            "address": "5FEwg9i9TZMEQRCW8pEe9UYreSn1RJBuXqJZXsozv12LCjyE",
            "name": "ocw-node-2",
            "minBalance": 1000,
            "group": accountGroups.DDC,
          },
          {
            "address": "5GRK2Nq72ob6L31MeJ4YGDFbEbjD16YamKFby543g76ZHwLt",
            "name": "ocw-node-4",
            "minBalance": 1000,
            "group": accountGroups.DDC
          },
          {
            "address": "5HZBfpk4XfLsBuLjb83Ly146FFrDBvzqLqSgwGEE9SWNz8Gf",
            "name": "ocw-node-8",
            "minBalance": 1000,
            "group": accountGroups.DDC
          },
          {
            "address": "5G47ZMPqJYhGCqjeqNGZn6PRKctvQJFusazGyWN6GT3Ljssr",
            "name": "davinci-ddc-wallet",
            "minBalance": 1000,
            "group": accountGroups.DAVINCI
          }
        ]
      }
    ]
  },
  {
    "name": blockchainNames.POLYGON,
    "nativeTokenSymbol": tokenSymbols.MATIC,
    "networks": [{
        "name": networkNames.TESTNET,
        "cereTokenContractAddress": "0xd111d479e23A8342A81ad595Ea1CAF229B3528c3",
        "rpcUrl": "https://rpc-mumbai.matic.today",
        "accounts": [
          {
            "address": "0x78408C4240dC5Cf55202113572aba37150DFF89A",
            "name": "polygon-relayer-0",
            "minBalance": 1,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "0x5F569F9183BD44D2e46B872270Af9E620ED83d0D",
            "name": "polygon-relayer-1",
            "minBalance": 1,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "0x5311d410571961A9cc3F97eD98A4088AB96E4Dd1",
            "name": "polygon-relayer-2",
            "minBalance": 1,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "0x8Ee8876d13e79b846fb6c3e5Ffe226a2e111387a",
            "name": "polygon-erc20-handler",
            "minBalance": 100,
            "type": tokenTypes.ERC20,
            "tokenSymbol": 'CERE', // by fact it has "CN" token symbol
            "erc20TokenAddress": "0xd111d479e23A8342A81ad595Ea1CAF229B3528c3",
            "group": accountGroups.BRIDGE
          }
        ]
      },
      {
        "name": networkNames.MAINNET,
        "cereTokenContractAddress": "0x2da719db753dfa10a62e140f436e1d67f2ddb0d6",
        "rpcUrl": "https://matic-mainnet.chainstacklabs.com",
        "accounts": [
          {
            "address": "0x4478e3B0B71531DAc9d0ECe9357eBB0043669804",
            "name": "fiat-gateway-contract",
            "minBalance": 10000,
            "type": tokenTypes.ERC20,
            "erc20TokenAddress": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
            "tokenSymbol": "USDC",
            "group": accountGroups.DAVINCI
          },
          {
            "address": "0x2352f1167F1c1c5273bB64a1FEEAf9dF49702A19",
            "name": "fiat-gateway-service-gas",
            "minBalance": 20,
            "group": accountGroups.DAVINCI
          },
          {
            "address": "0xD5E601af441E75E2c90dE56b884f93Cab991018C",
            "name": "polygon-relayer-0",
            "minBalance": 5,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "0x1FD36AfaAD703922b896DeBC64aC3A5c866d5e6F",
            "name": "polygon-relayer-1",
            "minBalance": 5,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "0xd1Dd4F25136BaF6C180616196bd994DA5E7102e8",
            "name": "polygon-relayer-2",
            "minBalance": 5,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "0xa4dD2305220351B999aeE038E615972708719306",
            "name": "polygon-relayer-3",
            "minBalance": 5,
            "group": accountGroups.BRIDGE_RELAYERS
          },
          {
            "address": "0x8fe028Eb002bbc3ec45c5dF8acfFf67eC95B6f88",
            "name": "polygon-erc20-handler",
            "minBalance": 10000000,
            "type": tokenTypes.ERC20,
            "erc20TokenAddress": "0x2da719db753dfa10a62e140f436e1d67f2ddb0d6",
            "tokenSymbol": "CERE",
            "group": accountGroups.BRIDGE
          }
        ]
      }
    ]
  },
  {
    "name": blockchainNames.ETHEREUM,
    "nativeTokenSymbol": tokenSymbols.ETH,
    "networks": [
      {
        "name": networkNames.MAINNET,
        "cereTokenContractAddress": "0x2da719db753dfa10a62e140f436e1d67f2ddb0d6",
        "rpcUrl": "https://main-light.eth.linkpool.io",
        "accounts": [{
          "address": "0x8fe028Eb002bbc3ec45c5dF8acfFf67eC95B6f88",
          "name": "ethereum-erc20-handler",
          "minBalance": 10000000,
          "type": "ERC20",
          "erc20TokenAddress": "0x2da719db753dfa10a62e140f436e1d67f2ddb0d6",
          "tokenSymbol": "CERE",
          "group": "BRIDGE"
        }]
      },
      {
        "name": networkNames.TESTNET,
        "cereTokenContractAddress": "0x0b10e304088b2BA2B2acfD2f72573FAaD31a13A5",
        "rpcUrl": " https://rpc.goerli.mudit.blog",
        "accounts": [{
          "address": "0x92c1576845703089CF6c0788379ED81f75F45dd5",
          "name": "ethereum-erc20-handler",
          "minBalance": 10000000,
          "type": "ERC20",
          "erc20TokenAddress": "0x0b10e304088b2BA2B2acfD2f72573FAaD31a13A5",
          "tokenSymbol": "CERE",
          "group": "BRIDGE"
        }]
      }
    ]
  }
]

// Deprecated config from NETWORKS variable
// ToDo remove it later
const networks = JSON.parse(`[${process.env.NETWORKS}]`);
const cereDevnet = networks.find(network => network.NETWORK === networkNames.DEVNET);
const cereQanet = networks.find(network => network.NETWORK === networkNames.QANET);
const cereTestnet = networks.find(network => network.NETWORK === networkNames.TESTNET);

blockchains.forEach(blockchain => {
  blockchain.networks.forEach(network => {
    if(blockchain.name === blockchainNames.CERE) {
      switch(network.name) {
        case networkNames.DEVNET:
          network.faucetMnemonic = cereDevnet.MNEMONICS;
          network.rpcUrl = cereDevnet.URL;
          break;
        case networkNames.QANET:
          network.faucetMnemonic = cereQanet.MNEMONICS;
          network.rpcUrl = cereQanet.URL;
          break;
        case networkNames.TESTNET:
          network.faucetMnemonic = cereTestnet.MNEMONICS;
          network.rpcUrl = cereTestnet.URL;
          break;        
        default:
          console.warn(`Network "${network.name}" is not supported`);
      }
    }
      
    network.accounts && network.accounts.forEach(account => {        
      if(!account.type) account.type = tokenTypes.NATIVE;
      if(!account.tokenSymbol) account.tokenSymbol = blockchain.nativeTokenSymbol;
    });
  });
});

module.exports = { blockchainNames, tokenSymbols, tokenTypes, accountGroups, networkNames, decimals, blockchains }
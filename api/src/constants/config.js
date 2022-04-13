const { blockchainNames, accountGroups, tokenSymbols, tokenTypes, networkNames } = require('./blockchains');
const cereTypes = require('./cereTypes');

let blockchains = [
  {
    "name": blockchainNames.CERE,
    "nativeTokenSymbol": tokenSymbols.CERE,
    "networks": [
      {
        "name": networkNames.DEVNET,
        "rpcUrl": "wss://rpc.devnet.cere.network:9945",
        "mnemonic": "",
      },
      {
        "name": networkNames.QANET,
        "rpcUrl": "wss://rpc.qanet.cere.network:9945",
        "mnemonic": "",
      },
      {
        "name": networkNames.TESTNET,
        "rpcUrl": "wss://rpc.testnet.cere.network:9945",
        "mnemonic": "",
        "accounts": [
          {
            "address": "5GjivYu4Sb9qNLWp6GYqm5VgPqbYCA2JsePBENAZTdsgqGmn",
            "name": "relayer-0",
            "minBalance": 5,
            "group": accountGroups.BRIDGE,
          },
          {
            "address": "5GjivYu4Sb9qNLWp6GYqm5VgPqbYCA2JsePBENAZTdsgqGmn",
            "name": "relayer-0",
            "minBalance": 5,
            "group": accountGroups.BRIDGE,
          },
          {
            "address": "5FRkUfyFFnmMGMyahCVPph11tLJhSsTgzk3dJz9PHQayjJnV",
            "name": "relayer-1",
            "minBalance": 5,
            "group": accountGroups.BRIDGE,
          },
          {
            "address": "5DcK9wGDQfdjH75Wu9KWbax25sKp9gAHHABFMaTxzYUMbUax",
            "name": "relayer-2",
            "minBalance": 5,
            "group": accountGroups.BRIDGE,
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
        "mnemonic": "",
        "accounts": [
          {
            "address": "5DDArkL7BzgQqRSKF4jeaDUi9ezr9UbYYjX6G3dyDM2eA3bi",
            "name": "relayer-0",
            "minBalance": 10,
            "group": accountGroups.BRIDGE,
          },
          {
            "address": "5DMDToa27GZhHBCS6vr7evgnyz1XJdfb3CZejSPQuTEH1fMZ",
            "name": "relayer-1",
            "minBalance": 10,
            "group": accountGroups.BRIDGE
          },
          {
            "address": "5FPAKxVmwCj4DMnHJmnnWffztwUyvVucbgaGDUaSjcFqKuHe",
            "name": "relayer-2",
            "minBalance": 10,
            "group": accountGroups.BRIDGE
          },
          {
            "address": "5DRzvs36qMwHdHxw1iE4hJMbsrbfqz9DpDNd52wqyBQcRgwh",
            "name": "relayer-3",
            "minBalance": 10,
            "group": accountGroups.BRIDGE
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
    "networks": [
      {
        "name": networkNames.TESTNET,
        "rpcUrl": "https://polygon-mumbai.infura.io/v3/ef1894c45068455680d1b08a35a6e83b",
        "cereTokenContractAddress": "0xd111d479e23A8342A81ad595Ea1CAF229B3528c3",
        "accounts": [
          {
            "address": "0x78408C4240dC5Cf55202113572aba37150DFF89A",
            "name": "polygon-relayer-0",
            "minBalance": 1,
            "group": accountGroups.BRIDGE
          },
          {
            "address": "0x5F569F9183BD44D2e46B872270Af9E620ED83d0D",
            "name": "polygon-relayer-1",
            "minBalance": 1,
            "group": accountGroups.BRIDGE
          },
          {
            "address": "0x5311d410571961A9cc3F97eD98A4088AB96E4Dd1",
            "name": "polygon-relayer-2",
            "minBalance": 1,
            "group": accountGroups.BRIDGE
          },
          {
            "address": "0x8Ee8876d13e79b846fb6c3e5Ffe226a2e111387a",
            "name": "polygon-erc20-handler",
            "minBalance": 100,
            "type": tokenTypes.ERC20,
            "tokenSymbol": 'CN', // why it's CN and not CEERE ?
            "erc20TokenAddress": "0xd111d479e23A8342A81ad595Ea1CAF229B3528c3",
            "group": accountGroups.BRIDGE
          }
        ]
      },
      {
        "name": networkNames.MAINNET,
        "rpcUrl": "https://polygon-mainnet.infura.io/v3/b02e9d9902654c29b15508f943aab443",
        "cereTokenContractAddress": "0x2da719db753dfa10a62e140f436e1d67f2ddb0d6",
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
            "group": accountGroups.BRIDGE
          },
          {
            "address": "0x1FD36AfaAD703922b896DeBC64aC3A5c866d5e6F",
            "name": "polygon-relayer-1",
            "minBalance": 5,
            "group": accountGroups.BRIDGE
          },
          {
            "address": "0xd1Dd4F25136BaF6C180616196bd994DA5E7102e8",
            "name": "polygon-relayer-2",
            "minBalance": 5,
            "group": accountGroups.BRIDGE
          },
          {
            "address": "0xa4dD2305220351B999aeE038E615972708719306",
            "name": "polygon-relayer-3",
            "minBalance": 5,
            "group": accountGroups.BRIDGE
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
  }
]

blockchains.forEach(blockchain => {
  blockchain.networks.forEach(network => {
      network.accounts && network.accounts.forEach(account => {
        if(!account.type) account.type = tokenTypes.NATIVE;
        if(!account.tokenSymbol) account.tokenSymbol = blockchain.nativeTokenSymbol;
      });
  });
});

blockchains =  (process.env.blockchains && JSON.parse(process.env.blockchains)) || blockchains


module.exports = { cereTypes, blockchains };

export const config = {
  id: 'polkadot',
  name: 'Polkadot',
  tokenSymbol: 'DOT',
  tokenDecimals: 10,
  ss58Format: 0,
  coinGeckoDenom: 'polkadot',
  nodeWs: 'wss://rpc.polkadot.io',
  backendWs: 'wss://polkadot.polkastats.io/graphql',
  backendHttp: 'https://polkadot.polkastats.io/graphql',
  backendAPI: 'https://polkadot.polkastats.io',
  googleAnalytics: 'UA-144344973-1',
  theme: '@/assets/scss/themes/polkastats.scss',
  // ranking
  historySize: 84, // 84 days
  erasPerDay: 1,
  validatorSetSize: 24,
}

export const links = {
  account: [
    {
      name: 'Dotscanner',
      path: 'https://dotscanner.com/polkadot/account/',
      icon: 'dotscanner.png',
    },
    {
      name: 'Kodadot',
      path: 'https://kodadot.xyz/rmrk/u/',
      icon: 'kodadot.png',
    },
    {
      name: 'Polkascan',
      path: 'https://polkascan.io/polkadot/account/',
      icon: 'polkascan.png',
    },
    {
      name: 'Singular (NFTs)',
      path: 'https://singular.rmrk.app/space/',
      icon: 'singular.svg',
    },
    {
      name: 'SubID',
      path: 'https://sub.id/',
      icon: 'subid.svg',
    },
    {
      name: 'Subscan',
      path: 'https://polkadot.subscan.io/account/',
      icon: 'subscan.svg',
    },
  ],
  validator: [
    {
      name: 'Polkadot JS Apps',
      path: 'https://polkadot.js.org/apps/?rpc=wss://rpc.polkadot.io#/staking/query/',
      icon: 'polkadot-js.png',
    },
    {
      name: 'Subscan',
      path: 'https://kusama.subscan.io/validator/',
      icon: 'subscan.svg',
    },
  ],
}

export const paginationOptions = [10, 20, 50, 100]

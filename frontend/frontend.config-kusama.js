export const config = {
  id: 'kusama',
  name: 'Kusama',
  tokenSymbol: 'KSM',
  tokenDecimals: 12,
  ss58Format: 2,
  coinGeckoDenom: 'kusama',
  nodeWs: 'wss://kusama-rpc.polkadot.io',
  backendWs: 'wss://kusama.polkastats.io/graphql',
  backendHttp: 'https://kusama.polkastats.io/graphql',
  backendAPI: 'https://kusama.polkastats.io',
  googleAnalytics: 'UA-172854168-1',
  theme: '@/assets/scss/themes/polkastats.scss',
  // ranking
  historySize: 84, // 21 days
  erasPerDay: 4,
  validatorSetSize: 24,
}

export const links = [
  {
    name: 'Dotscanner',
    path: 'https://dotscanner.com/kusama/account/',
    icon: 'dotscanner.png',
  },
  {
    name: 'Kodadot',
    path: 'https://kodadot.xyz/rmrk/u/',
    icon: 'kodadot.png',
  },
  {
    name: 'Polkascan',
    path: 'https://polkascan.io/kusama/account/',
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
    path: 'https://kusama.subscan.io/account/',
    icon: 'subscan.svg',
  },
]

export const paginationOptions = [10, 20, 50, 100]

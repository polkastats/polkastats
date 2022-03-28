export const network = {
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
export const paginationOptions = [10, 20, 50, 100]

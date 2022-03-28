export const network = {
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
export const paginationOptions = [10, 20, 50, 100]

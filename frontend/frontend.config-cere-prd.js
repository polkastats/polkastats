export const network = {
  id: 'cere',
  name: 'Cere Network',
  tokenSymbol: 'CERE',
  tokenDecimals: 10,
  ss58Format: -1,
  coinGeckoDenom: 'cere-network',
  nodeWs: 'wss://archive.mainnet.cere.network/ws',
  backendWs: 'wss://hasura.stats.cere.network/v1/graphql',
  backendHttp: 'https://api.stats.cere.network/api/v1',
  googleAnalytics: 'UA-167490397-2',
  theme: '@/assets/scss/themes/polkastats.scss',
  // ranking               Í
  historySize: 16, // 16 days
  erasPerDay: 1,
  validatorSetSize: 24,
}
export const paginationOptions = [10, 20, 50, 100]

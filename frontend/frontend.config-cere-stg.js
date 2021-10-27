export const network = {
  id: 'cere',
  name: 'Cere Network',
  tokenSymbol: 'CERE',
  tokenDecimals: 10,
  ss58Format: -1,
  coinGeckoDenom: 'cere',
  nodeWs: 'wss://archive.mainnet.cere.network:9945',
  backendWs: 'wss://hasura.stats.stg.cere.network/v1/graphql',
  backendHttp: 'https://api.stats.stg.cere.network/api/v1',
  // remove after testing
  googleAnalytics: 'UA-167490397-2',
  theme: '@/assets/scss/themes/polkastats.scss',
  // ranking               Í
  historySize: 84, // 84 days
  erasPerDay: 1,
  validatorSetSize: 24,
}
export const paginationOptions = [10, 20, 50, 100]

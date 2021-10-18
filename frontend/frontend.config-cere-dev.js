export const network = {
  id: 'cere',
  name: 'Cerebellum Network',
  tokenSymbol: 'CERE',
  tokenDecimals: 10,
  ss58Format: -1,
  coinGeckoDenom: 'cere',
  nodeWs: 'wss://archive.testnet.cere.network:9945',
  backendWs: 'wss://hasura.stats.dev.cere.network/v1/graphql',
  backendHttp: 'https://api.stats.dev.cere.network/api/v1',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/polkastats.scss',
  // ranking               Í
  historySize: 84, // 84 days
  erasPerDay: 1,
  validatorSetSize: 24,
}
export const paginationOptions = [10, 20, 50, 100]

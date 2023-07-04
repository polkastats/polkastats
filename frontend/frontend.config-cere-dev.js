export const network = {
  id: 'cere',
  name: 'Cere Network',
  tokenSymbol: 'CERE',
  tokenDecimals: 10,
  ss58Format: -1,
  coinGeckoDenom: 'cere-network',
  nodeWs: 'wss://archive.testnet.cere.network/ws',
  backendWs: 'wss://stats-hasura.network-dev.aws.cere.io/v1/graphql',
  backendHttp: 'https://dev-stats-api.network-dev.aws.cere.io/api/v1',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/polkastats.scss',
  // ranking               Í
  historySize: 16, // 16 days
  erasPerDay: 1,
  validatorSetSize: 24,
}
export const paginationOptions = [10, 20, 50, 100]

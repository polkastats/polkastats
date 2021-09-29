export const network = {
  id: 'cere',
  name: 'Cerebellum Network',
  tokenSymbol: 'CERE',
  tokenDecimals: 10,
  ss58Format: -1,
  coinGeckoDenom: 'cere',
  nodeWs: 'wss://archive.mainnet.cere.network:9945',
  backendWs: 'wss://api.cerestats.io/api/v1',
  backendHttp: 'https://api.cerestats.io/api/v1',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/polkastats.scss',
  // ranking
  historySize: 84, // 84 days
  erasPerDay: 1,
  validatorSetSize: 24,
}
export const paginationOptions = [10, 20, 50, 100]
export const network = {
  id: 'polkadot',
  name: 'Polkadot',
  tokenSymbol: 'DOT',
  tokenDecimals: 10,
  ss58Format: 0,
  coinGeckoDenom: 'polkadot',
  nodeWs: 'wss://rpc.polkadot.network',
  backendWs: 'wss://dev.polkadot.polkastats.io/api/v3',
  backendHttp: 'https://dev.polkadot.polkastats.io/api/v3',
  googleAnalytics: '',
  theme: '@/assets/scss/themes/polkastats.scss',
  // ranking
  historySize: 84, // 21 days
  erasPerDay: 1,
  validatorSetSize: 24,
}
export const paginationOptions = [10, 20, 50, 100]

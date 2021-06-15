export const config = {
  name: 'kusama',
  title: 'PolkaStats NG',
  nodeWs: 'wss://kusama-rpc.polkadot.io',
  denom: 'KSM',
  addressPrefix: 2,
  tokenDecimals: 12,
  historySize: 84, // 21 days
  erasPerDay: 4,
  theme: '@/assets/scss/themes/kusama.scss',
  identiconTheme: 'polkadot',
  logo: 'img/logo/kusama.svg',
  favicon: 'img/favicon/kusama.ico',
  baseURL: '/',
  showValSelectorInPage: false, // set to false when showing val selector in header
  googleAnalytics: null,
  backendWs: 'wss://dev.kusama.polkastats.io/api/v3',
  backendHttp: 'https://dev.kusama.polkastats.io/api/v3',
}

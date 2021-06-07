export const config = {
  name: 'kusama',
  title: 'Validator Resource Center and Ranking',
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
  googleAnalytics: 'G-0MDQV4GFD9',
  backendWs: 'wss://validatorsv2.kusama.polkastats.io/api/v3',
  backendHttp: 'https://validatorsv2.kusama.polkastats.io/api/v3',
}

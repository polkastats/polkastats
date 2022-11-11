import { network } from './frontend.config.js'
export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Cere Stats',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'Cere Stats',
      },
    ],
    link: [{ rel: 'icon', type: 'image/png', href: '/img/favicon.ico' }],
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [network.theme],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    // https://google-analytics.nuxtjs.org/setup
    '@nuxtjs/google-analytics',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://i18n.nuxtjs.org
    'nuxt-i18n',
    // https://github.com/nuxt-community/apollo-module
    '@nuxtjs/apollo',
    // https://github.com/nuxt-community/fontawesome-module
    '@nuxtjs/fontawesome',
    // https://www.npmjs.com/package/nuxt-clipboard2
    'nuxt-clipboard2',
    // https://www.npmjs.com/package/cookie-universal-nuxt
    ['cookie-universal-nuxt', { alias: 'cookies' }],
    // https://github.com/nuxt-community/redirect-module
    '@nuxtjs/redirect-module',
  ],

  // Module configurations
  axios: {},

  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
    vueI18n: {
      fallbackLocale: 'en',
      messages: {
        en: require('./locales/en.json'),
        es: require('./locales/es.json'),
      },
    },
  },
  apollo: {
    clientConfigs: {
      default: {
        httpEndpoint: network.backendHttp,
        wsEndpoint: network.backendWs,
        websocketsOnly: true,
      },
    },
  },
  bootstrapVue: {
    bootstrapCSS: false,
    bootstrapVueCSS: false,
  },
  fontawesome: {
    icons: {
      solid: true,
      regular: true,
      brands: true,
    },
  },
  googleAnalytics: {
    id: network.googleAnalytics,
  },
  redirect: [{ from: '^/intention/(.*)$', to: '/validator/$1' }],

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    transpile: [
      '@polkadot/vue-identicon',
      '@polkadot/x-ws',
      '@polkadot/api',
      '@polkadot/api-derive',
      '@polkadot/keyring',
      '@polkadot/networks',
      '@polkadot/rpc-augment',
      '@polkadot/rpc-core',
      '@polkadot/rpc-provider',
      '@polkadot/types',
      '@polkadot/types-known',
      '@polkadot/ui-shared',
      '@polkadot/util',
      '@polkadot/util-crypto',
      '@polkadot/x-bigint',
      '@polkadot/x-fetch',
      '@polkadot/x-global',
      '@polkadot/x-randomvalues',
      '@polkadot/x-textdecoder',
      '@polkadot/x-textencoder',
      '@polkadot/x-ws',
      '@polkadot/wasm-bridge',
    ],
    extend(config, ctx) {
      config.module.rules.push({
        test: /\.js$/,
        loader: require.resolve('@open-wc/webpack-import-meta-loader'),
      })
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      })
      // https://github.com/nuxt/nuxt.js/issues/1142
      config.resolve.alias.vue = 'vue/dist/vue.common'
    },
  },

  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
        loader: 'vue-svg-loader',
      },
    ],
  },
}

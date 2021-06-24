import { network } from './frontend.config.js'
export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'PolkaStats NG',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: 'PolkaStats block explorer',
      },
    ],
    link: [{ rel: 'icon', type: 'image/png', href: '/img/favicon.png' }],
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
    // https://github.com/nuxt-community/recaptcha-module
    '@nuxtjs/recaptcha',
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
  recaptcha: {
    hideBadge: true, // Hide badge element (v3 & v2 via size=invisible)
    language: 'en', // Recaptcha language (v2)
    siteKey: '6LfNcPIaAAAAAJgyccwkRP0gmSzmsw0opCuQg76l', // Site key for requests
    version: 2, // Version
    size: 'compact', // Size: 'compact', 'normal', 'invisible' (v2)
  },

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    extend(config) {
      if (config.resolve.extensions) {
        config.resolve.extensions.push('.mjs')
      } else {
        config.resolve.extensions = ['.mjs']
      }
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

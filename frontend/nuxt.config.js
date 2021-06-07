import { config } from './config.js'
export default {
  // Disable server-side rendering (https://go.nuxtjs.dev/ssr-mode)
  ssr: false,

  // Target (https://go.nuxtjs.dev/config-target)
  target: 'static',

  router: {
    base: config.baseURL,
  },

  // Global page headers (https://go.nuxtjs.dev/config-head)
  head: {
    // title: `${config.title} for ${
    //   config.name.charAt(0).toUpperCase() + config.name.slice(1)
    // }`,
    title: `Kusama, Polkadot's Canary Network | Validator ranking`,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content:
          'Kusama is a scalable multi-chain network for radical innovation and early stage Polkadot deployments. Expect Chaos. No promises.',
      },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: config.favicon }],
  },

  // Global CSS (https://go.nuxtjs.dev/config-css)
  css: [config.theme],

  // Plugins to run before rendering page (https://go.nuxtjs.dev/config-plugins)
  plugins: ['@/plugins/vue-typed-text.js', '@/plugins/vue-gtag.js'],

  // Auto import components (https://go.nuxtjs.dev/config-components)
  components: true,

  // Modules for dev and build (recommended) (https://go.nuxtjs.dev/config-modules)
  buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://www.npmjs.com/package/@nuxtjs/google-fonts
    [
      '@nuxtjs/google-fonts',
      {
        families: {
          'Space+Mono': [400, 700],
        },
      },
    ],
    // https://github.com/nuxt-community/fontawesome-module
    '@nuxtjs/fontawesome',
  ],

  // Modules (https://go.nuxtjs.dev/config-modules)
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    // https://www.npmjs.com/package/cookie-universal-nuxt
    ['cookie-universal-nuxt', { alias: 'cookies' }],
    // https://www.npmjs.com/package/nuxt-clipboard2
    'nuxt-clipboard2',
    // https://www.npmjs.com/package/vue-scrollto
    'vue-scrollto/nuxt',
    // https://github.com/nuxt-community/apollo-module
    '@nuxtjs/apollo',
  ],
  bootstrapVue: {
    bootstrapCSS: false,
    bootstrapVueCSS: false,
  },
  fontawesome: {
    icons: {
      solid: true,
      regular: true,
    },
  },
  apollo: {
    clientConfigs: {
      default: {
        httpEndpoint: config.backendHttp,
        wsEndpoint: config.backendWs,
        websocketsOnly: true,
      },
    },
  },

  // Axios module configuration (https://go.nuxtjs.dev/config-axios)
  axios: {},

  // Build Configuration (https://go.nuxtjs.dev/config-build)
  build: {
    extend(config) {
      if (config.resolve.extensions) {
        config.resolve.extensions.push('.mjs')
      } else {
        config.resolve.extensions = ['.mjs']
      }
      config.resolve.alias.vue = 'vue/dist/vue.common'
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      })
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

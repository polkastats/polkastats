import Vue from 'vue'
import VueGtag from 'vue-gtag'
import { config } from '@/config.js'

export default ({ app }) => {
  const kusamaValidatorsNetwork = JSON.parse(
    decodeURIComponent(localStorage.getItem('kusamaValidatorsNetwork'))
  )
  Vue.use(
    VueGtag,
    {
      config: {
        id: config.googleAnalytics,
        disabled: kusamaValidatorsNetwork
          ? !kusamaValidatorsNetwork.googleAnalytics
          : true,
      },
    },
    app.router
  )
}

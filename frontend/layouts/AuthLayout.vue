
<template>
  <div class="pkd" layout="auth">
    <header-frame />
	<content-frame />
    <footer-frame />
  </div>
</template>

<script>
import HeaderFrame from './auth/HeaderFrame.vue'
import ContentFrame from './auth/ContentFrame.vue'
import FooterFrame from './auth/FooterFrame.vue'
import { config } from '@/frontend.config.js'
import { ApiPromise, WsProvider } from '@polkadot/api'

export default {
  components: { HeaderFrame, ContentFrame, FooterFrame },
  data() {
    return {
      toggled: false,
      polling: null,
    }
  },
  computed: {
    selectedAddress() {
      return this.$store.state.ranking.selectedAddress
    },
    chainValidatorAddresses() {
      return this.$store.state.ranking.chainValidatorAddresses
    },
  },
  async created() {
    this.$store.dispatch('ranking/loadSelected')
    if (this.$store.state.ranking.list.length === 0) {
      await this.$store.dispatch('ranking/updateList')
    }
    if (this.$cookies.get(`${config.name}-exclude`)) {
      this.exclude = this.$cookies.get(`${config.name}-exclude`)
    }
    if (this.$cookies.get(`${config.name}-filter`)) {
      this.filter = this.$cookies.get(`${config.name}-filter`)
    }
    // update ranking every 1 min
    this.polling = setInterval(async () => {
      // eslint-disable-next-line
      console.log('refreshing ranking data...')
      await this.$store.dispatch('ranking/updateList')
      if (this.selectedAddress) {
        // eslint-disable-next-line
        console.log('updating on-chain validator set...')
        await this.importChainValidatorAddresses(this.selectedAddress)
        // eslint-disable-next-line
        console.log('done!')
      }
    }, 60 * 1000)
  },
  beforeDestroy() {
    clearInterval(this.polling)
  },
  methods: {
    toggleSidebar() {
      this.toggled = !this.toggled
    },
    async importChainValidatorAddresses(address) {
      const wsProvider = new WsProvider(config.nodeWs)
      const api = await ApiPromise.create({ provider: wsProvider })
      await api.isReady
      const chainStaking = await api.query.staking.nominators(address)
      const staking = JSON.parse(JSON.stringify(chainStaking))
      if (staking?.targets.length > 0) {
        await this.$store.dispatch(
          'ranking/importChainValidatorAddresses',
          staking.targets
        )
      }
      api.disconnect()
    },
  },
}
</script>
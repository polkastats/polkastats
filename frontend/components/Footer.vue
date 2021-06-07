<template>
  <footer class="footer">
    <div class="container text-center text-muted">
      &copy; {{ new Date().getFullYear() }} {{ capitalize(config.name) }} VRC -
      Developed by
      <a href="https://polkastats.io" target="_blank">PolkaStats</a>
      ·
      <nuxt-link to="/terms">Terms of use</nuxt-link>
      ·
      <nuxt-link to="/privacy">Privacy policy</nuxt-link>
      ·
      <a href="#" @click.prevent="Klaro.show()">Cookie Settings</a>
      ·
      <a
        href="https://github.com/Colm3na/kusama-validator-resource-center-v2/"
        target="_blank"
        >Fork me on GitHub!</a
      >
      <p class="mb-0">
        <a href="https://kusama.network" target="_blank" title="Kusama">
          <img class="logo" alt="Kusama" src="img/logo/kusama.svg" />
        </a>
      </p>
      <p class="mt-0">
        Project funded by
        <a
          href="https://kusama.polkassembly.io/motion/217"
          target="_blank"
          title="Kusama Treasury"
        >
          Kusama Treasury</a
        >
      </p>
    </div>
  </footer>
</template>
<script>
import { config } from '@/config.js'
import commonMixin from '@/mixins/commonMixin.js'
import * as Klaro from 'klaro'
import { klaroConfig } from '@/klaro.config.js'
Klaro.setup(klaroConfig)
export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
      Klaro,
    }
  },
  created() {
    const vm = this
    setInterval(function () {
      const kusamaValidatorsNetwork = JSON.parse(
        decodeURIComponent(localStorage.getItem('kusamaValidatorsNetwork'))
      )
      if (kusamaValidatorsNetwork) {
        if (kusamaValidatorsNetwork.googleAnalytics) {
          vm.$gtag.optIn()
        } else {
          vm.$gtag.optOut()
        }
      } else {
        vm.$gtag.optOut()
      }
    }, 10000)
  },
}
</script>

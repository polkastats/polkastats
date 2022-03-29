<template>
  <b-navbar toggleable="xl">
    <b-container class="px-sm-3">
      <b-navbar-brand>
        <nuxt-link
          to="/"
          class="navbar-brand"
          title="PolkaStats block explorer"
        >
          <img class="logo" src="/img/polkastats_logo_dark@1x.png" />
        </nuxt-link>
      </b-navbar-brand>
      <a
        v-if="network.coinGeckoDenom && USDConversion && USD24hChange"
        :href="`https://www.coingecko.com/en/coins/${network.coinGeckoDenom}`"
        target="_blank"
        class="fiat mh-2"
      >
        <strong>{{ network.tokenSymbol }}</strong> ${{ USDConversion }} ({{
          USD24hChange
        }}%)
      </a>
      <b-navbar-toggle target="nav-collapse" />
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item right to="/polkastats-validator">{{
            $t('layout.default.validator')
          }}</b-nav-item>
          <b-nav-item right to="/how-to-stake">{{
            $t('layout.default.how_to_stake')
          }}</b-nav-item>
          <b-nav-item-dropdown text="Staking">
            <b-dropdown-item to="/staking-dashboard">
              {{ $t('layout.default.staking_dashboard') }}
            </b-dropdown-item>
            <b-dropdown-item to="/validators">
              {{ $t('layout.default.validators') }}
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item-dropdown text="Blockchain">
            <b-dropdown-item to="/blocks">
              {{ $t('layout.default.blocks') }}
            </b-dropdown-item>
            <b-dropdown-item to="/transfers">
              {{ $t('layout.default.transfers') }}
            </b-dropdown-item>
            <b-dropdown-item to="/extrinsics">
              {{ $t('layout.default.extrinsics') }}
            </b-dropdown-item>
            <b-dropdown-item to="/events">
              {{ $t('layout.default.events') }}
            </b-dropdown-item>
          </b-nav-item-dropdown>
          <b-nav-item right to="/accounts">{{
            $t('layout.default.accounts')
          }}</b-nav-item>
        </b-navbar-nav>
        <b-dropdown class="my-md-2 ml-md-2 network" variant="primary2">
          <template #button-content>
            <img
              class="network-logo"
              :src="`/img/networks/icons/${network.id}.svg`"
            />
            {{ network.name }}
          </template>
          <b-dropdown-item href="https://kusama.polkastats.io">
            <img class="network-logo" src="/img/networks/icons/kusama.svg" />
            KUSAMA
          </b-dropdown-item>
          <b-dropdown-item href="https://polkastats.io">
            <img class="network-logo" src="/img/networks/icons/polkadot.svg" />
            POLKADOT
          </b-dropdown-item>
        </b-dropdown>
      </b-collapse>
    </b-container>
  </b-navbar>
</template>

<script>
import { network } from '@/frontend.config.js'
export default {
  data() {
    return {
      network,
    }
  },
  computed: {
    USDConversion() {
      return parseFloat(this.$store.state.fiat.usd).toFixed(3)
    },
    USD24hChange() {
      return parseFloat(this.$store.state.fiat.usd_24h_change).toFixed(2)
    },
  },
  created() {
    // Refresh fiat conversion values every minute
    if (this.network.coinGeckoDenom) {
      this.$store.dispatch('fiat/update')
      setInterval(() => {
        this.$store.dispatch('fiat/update')
      }, 60000)
    }
  },
}
</script>

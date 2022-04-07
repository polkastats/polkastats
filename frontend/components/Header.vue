<template>
  <div>
    <div class="container text-right pt-3">
      <button
        v-b-modal.wallet-modal
        type="button"
        class="btn btn-outline-info mr-2"
        style="font-size: 0.8rem"
      >
        <span v-if="selectedAddress">
          <Identicon :address="selectedAddress" :size="22" />
          {{ shortAddress(selectedAddress) }}
        </span>
        <span v-else>Connect</span>
      </button>
      <b-dropdown
        id="selected-validators"
        ref="selectedValidators"
        class="selected-validators mb-0"
        toggle-class="btn btn-selected"
        right
      >
        <template #button-content>
          <span v-if="loading" style="font-size: 0.8rem !important"
            >Selected</span
          >
          <span v-else style="font-size: 0.8rem !important">
            {{ selectedValidatorAddresses.length }}/{{
              config.validatorSetSize
            }}
            selected
          </span>
          <font-awesome-icon icon="hand-paper" />
        </template>
        <SelectedValidators />
      </b-dropdown>
    </div>
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
          v-if="config.coinGeckoDenom && USDConversion && USD24hChange"
          :href="`https://www.coingecko.com/en/coins/${config.coinGeckoDenom}`"
          target="_blank"
          class="fiat mh-2"
        >
          <strong>{{ config.tokenSymbol }}</strong> ${{ USDConversion }} ({{
            USD24hChange
          }}%)
        </a>
        <b-navbar-toggle target="nav-collapse" />
        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-item right to="/accounts">{{
              $t('layout.default.accounts')
            }}</b-nav-item>
            <b-nav-item right to="/transfers">{{
              $t('layout.default.transfers')
            }}</b-nav-item>
            <b-nav-item-dropdown text="Staking">
              <b-dropdown-item to="/staking/dashboard">
                {{ $t('layout.default.staking_dashboard') }}
              </b-dropdown-item>
              <b-dropdown-item to="/staking/validators">
                {{ $t('layout.default.validators') }}
              </b-dropdown-item>
              <b-dropdown-item to="/staking/polkastats-validator">
                {{ $t('layout.default.validator') }}
              </b-dropdown-item>
              <b-dropdown-item to="/staking/how-to-stake">
                {{ $t('layout.default.how_to_stake') }}
              </b-dropdown-item>
            </b-nav-item-dropdown>
            <b-nav-item-dropdown text="Blockchain">
              <b-dropdown-item to="/blocks">
                {{ $t('layout.default.blocks') }}
              </b-dropdown-item>
              <b-dropdown-item to="/extrinsics">
                {{ $t('layout.default.extrinsics') }}
              </b-dropdown-item>
              <b-dropdown-item to="/events">
                {{ $t('layout.default.events') }}
              </b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>
          <b-dropdown class="my-md-2 ml-md-2 pr-0 network" variant="primary2">
            <template #button-content>
              <img
                class="network-logo"
                :src="`/img/networks/icons/${config.id}.svg`"
              />
              {{ config.name }}
            </template>
            <b-dropdown-item href="https://kusama.polkastats.io">
              <img class="network-logo" src="/img/networks/icons/kusama.svg" />
              KUSAMA
            </b-dropdown-item>
            <b-dropdown-item href="https://polkastats.io">
              <img
                class="network-logo"
                src="/img/networks/icons/polkadot.svg"
              />
              POLKADOT
            </b-dropdown-item>
          </b-dropdown>
        </b-collapse>
      </b-container>
      <b-modal id="wallet-modal" size="lg" hide-header hide-footer>
        <template #default="{ hide }">
          <WalletSelector @close="hide()" />
          <p class="text-right mb-0">
            <b-button class="btn-sm" @click="hide()">Close</b-button>
          </p>
        </template>
      </b-modal>
    </b-navbar>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import { config } from '@/frontend.config.js'
export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
    }
  },
  computed: {
    loading() {
      return this.$store.state.ranking.loading
    },
    USDConversion() {
      return parseFloat(this.$store.state.fiat.usd).toFixed(3)
    },
    USD24hChange() {
      return parseFloat(this.$store.state.fiat.usd_24h_change).toFixed(2)
    },
    selectedValidatorAddresses() {
      return this.$store.state.ranking.selectedAddresses
    },
    selectedAddress() {
      return this.$store.state.ranking.selectedAddress
    },
  },
  created() {
    // Refresh fiat conversion values every minute
    if (this.config.coinGeckoDenom) {
      this.$store.dispatch('fiat/update')
      setInterval(() => {
        this.$store.dispatch('fiat/update')
      }, 60000)
    }
  },
}
</script>

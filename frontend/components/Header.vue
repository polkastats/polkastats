<template>
  <b-navbar type="dark" variant="dark">
    <b-container fluid>
      <span v-if="collapsed" v-b-tooltip.hover title="Show sidebar">
        <font-awesome-icon
          icon="chevron-right"
          style="cursor: pointer; font-size: 1.2rem; margin-left: -0.5rem"
          @click="toggleSidebar()"
        />
      </span>
      <span v-else v-b-tooltip.hover title="Collapse sidebar">
        <font-awesome-icon
          icon="chevron-left"
          style="cursor: pointer; font-size: 1.2rem; margin-left: -0.5rem"
          @click="toggleSidebar()"
        />
      </span>
      <b-navbar-nav>
        <button
          v-b-modal.wallet-modal
          type="button"
          class="btn btn-outline-info mr-4"
        >
          <span v-if="selectedAddress">
            <Identicon :address="selectedAddress" :size="22" />
            {{ shortAddress(selectedAddress) }}
          </span>
          <span v-else>Connect wallet</span>
        </button>
        <b-nav-item-dropdown
          id="selected-validators"
          ref="selectedValidators"
          class="selected-validators"
          toggle-class="btn btn-selected"
          right
        >
          <template #button-content>
            <span v-if="loading">Selected</span>
            <span v-else>
              {{ selectedValidatorAddresses.length }}/16 selected
            </span>
            <font-awesome-icon icon="hand-paper" />
          </template>
          <SelectedValidators />
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-container>
    <b-modal id="wallet-modal" size="lg">
      <template #modal-header></template>
      <template #default="{ hide }">
        <WalletSelector @close="hide()" />
        <p class="text-right mt-4 mb-0">
          <b-button class="btn-sm" @click="hide()">Close</b-button>
        </p>
      </template>
      <template #modal-footer></template>
    </b-modal>
  </b-navbar>
</template>

<script>
import { config } from '@/config.js'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
      collapsed: false,
    }
  },
  computed: {
    loading() {
      return this.$store.state.ranking.loading
    },
    selectedValidatorAddresses() {
      return this.$store.state.ranking.selectedAddresses
    },
    selectedAddress() {
      return this.$store.state.ranking.selectedAddress
    },
  },
  watch: {
    $route(to, from) {
      this.$refs.selectedValidators.hide(true)
    },
  },
  methods: {
    toggleSidebar() {
      this.collapsed = !this.collapsed
      this.$emit('toggle')
    },
  },
}
</script>

<template>
  <div
    v-b-tooltip.hover
    title="Click to copy validator address to clipboard"
    class="d-inline"
    @click="showToast"
  >
    <Identicon
      :key="address"
      v-clipboard:copy="address"
      :size="size"
      :theme="config.identiconTheme"
      :value="address"
      class="identicon"
    />
  </div>
</template>
<script>
import Identicon from '@polkadot/vue-identicon'
// eslint-disable-next-line
import { config } from '@/config.js'
export default {
  components: {
    Identicon,
  },
  props: {
    address: {
      type: String,
      default: () => '',
    },
    size: {
      type: Number,
      default: () => 20,
    },
  },
  data() {
    return {
      config,
    }
  },
  methods: {
    showToast() {
      this.$bvToast.toast(this.address, {
        title: 'Address copied to clipboard!',
        variant: 'secondary',
        autoHideDelay: 5000,
        appendToast: false,
      })
    },
  },
}
</script>

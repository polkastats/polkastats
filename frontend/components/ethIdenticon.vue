<template>
  <div
    v-b-tooltip.hover
    title="Click to copy address to clipboard"
    class="d-inline-block"
    @click="showToast"
  >
    <img
      :key="address"
      v-clipboard:copy="address"
      :src="getIdenticon(address)"
      class="eth-identicon"
      :width="size"
      :height="size"
    />
  </div>
</template>
<script>
import makeBlockie from 'ethereum-blockies-base64'
export default {
  props: {
    address: {
      type: String,
      default: () => '',
    },
    size: {
      type: Number,
      default: 32,
    },
  },
  methods: {
    getIdenticon(address) {
      return makeBlockie(address)
    },
    showToast() {
      this.$bvToast.toast(this.address, {
        title: 'Address copied to clipboard!',
        variant: 'success',
        autoHideDelay: 5000,
        appendToast: false,
      })
    },
  },
}
</script>

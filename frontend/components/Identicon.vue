<template>
  <div
    v-b-tooltip.hover
    :title="$t('components.identicon.click_to_copy')"
    class="d-inline-block"
    @click="showToast"
  >
    <VueIdenticon
      :key="address"
      v-clipboard:copy="address"
      :size="size"
      :theme="'polkadot'"
      :value="address"
      class="identicon"
    />
	<slot />
  </div>
</template>
<script>
import { Identicon } from '@polkadot/vue-identicon'

export default {
  components: {
    VueIdenticon: Identicon,
  },
  props: {
    address: {
      type: String,
      default: () => '',
    },
    theme: {
      type: String,
      default: () => 'polkadot',
    },
    size: {
      type: Number,
      default: () => 20,
    },
  },
  methods: {
    showToast() {
      this.$bvToast.toast(this.address, {
        title: this.$t('components.identicon.address_copied'),
        variant: 'success',
        autoHideDelay: 5000,
        appendToast: false,
      })
    },
  },
}
</script>

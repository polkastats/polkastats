<template>
  <div
    v-b-tooltip.hover
    :title="$t('components.identicon.click_to_copy')"
    class="d-inline-block"
    @click="copyTextAndShowToast"
  >
    <VueIdenticon
      :key="address"
      :size="size"
      :theme="'polkadot'"
      :value="address"
      class="identicon"
    />
    <b-toast :id="id" variant="success" solid>
      <template #toast-title>
        <div class="d-flex flex-grow-1 align-items-baseline">
          <strong class="mr-auto">{{
            $t('components.identicon.address_copied')
          }}</strong>
        </div>
      </template>
      <VueIdenticon
        :key="address"
        :size="size"
        :theme="theme"
        :value="address"
        class="identicon"
      />
      {{ shortAddress(address) }}
    </b-toast>
  </div>
</template>
<script>
import { Identicon } from '@polkadot/vue-identicon'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  components: {
    VueIdenticon: Identicon,
  },
  mixins: [commonMixin],
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
  data() {
    return {
      id: this.generateUniqueID(8),
    }
  },
  methods: {
    async copyTextAndShowToast() {
      this.$bvToast.show(this.id)
      try {
        await this.$copyText(this.address)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
    },
  },
}
</script>

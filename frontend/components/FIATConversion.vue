<template>
  <div
    v-if="units"
    v-b-tooltip.hover
    class="fiat-conversion d-inline-block"
    :title="`1 ${config.tokenSymbol} = $${USDConversion}`"
  >
    (${{ formatNumber(FIATValue.toFixed(2)) }})
  </div>
</template>
<script>
import { BigNumber } from 'bignumber.js'
import commonMixin from '@/mixins/commonMixin.js'
import { config } from '@/frontend.config.js'
export default {
  mixins: [commonMixin],
  props: {
    units: {
      type: Number,
      default: () => 0,
    },
    date: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      config,
    }
  },
  computed: {
    USDConversion() {
      return parseFloat(this.$store.state.fiat.usd)
    },
    FIATValue() {
      return (
        this.USDConversion *
        new BigNumber(this.units).div(
          new BigNumber(10).pow(config.tokenDecimals)
        )
      )
    },
  },
}
</script>
<style>
.fiat-conversion {
  font-size: 0.8rem;
  margin-left: 0.4rem;
}
</style>

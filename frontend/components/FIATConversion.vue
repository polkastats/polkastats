<template>
  <div v-if="units" class="d-inline-block" @click="historical = !historical">
    <div
      v-if="historical"
      v-b-tooltip.hover
      class="fiat-conversion d-inline-block"
      :title="`Estimated value at the day of transaction`"
    >
      (${{ formatNumber(historicalFIATValue.toFixed(2)) }})
    </div>
    <div
      v-else
      v-b-tooltip.hover
      class="fiat-conversion d-inline-block"
      :title="`Current value`"
    >
      (${{ formatNumber(FIATValue.toFixed(2)) }})
    </div>
  </div>
</template>
<script>
import axios from 'axios'
import { BigNumber } from 'bignumber.js'
import commonMixin from '@/mixins/commonMixin.js'
import { config } from '@/frontend.config.js'

export default {
  mixins: [commonMixin],
  props: {
    units: {
      type: Number,
      default: () => 0,
      required: true,
    },
    date: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      historical: false,
      config,
      historicalFIATValue: 0,
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
  async mounted() {
    this.historicalFIATValue = await this.getHistoricalFIATValue()
  },
  methods: {
    async getHistoricalFIATValue() {
      if (config.coinGeckoDenom) {
        const response = await axios
          .get(
            `https://api.coingecko.com/api/v3/coins/${config.coinGeckoDenom}/history?date=${this.date}`
          )
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.log('Error fetching historical fiat value: ', error)
          })
          .finally(() => {
            return 0
          })
        return (
          response.data.market_data.current_price.usd *
          new BigNumber(this.units).div(
            new BigNumber(10).pow(config.tokenDecimals)
          )
        )
      }
    },
  },
}
</script>
<style>
.fiat-conversion {
  font-size: 0.8rem;
  margin-left: 0.4rem;
  padding: 0.2rem 0.4rem;
  background-color: rgb(192, 229, 243);
  border-radius: 0.2rem;
  cursor: pointer;
  animation-duration: 0.6s;
  color: rgb(11, 129, 168);
}
.fiat-conversion:hover {
  background-color: rgb(11, 129, 168);
  color: white;
  animation-name: onHoverAnimation;
}

@keyframes onHoverAnimation {
  0% {
    background-color: rgb(192, 229, 243);
  }
  100% {
    background-color: rgb(11, 129, 168);
  }
}
</style>

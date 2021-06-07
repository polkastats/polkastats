import { isHex } from '@polkadot/util'
import { BigNumber } from 'bignumber.js'
import { config } from '@/config.js'

export default {
  methods: {
    shortAddress(address) {
      return (
        address.substring(0, 5) + '…' + address.substring(address.length - 5)
      )
    },
    formatNumber(number) {
      if (isHex(number)) {
        return parseInt(number, 16)
          .toString()
          .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      } else {
        return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      }
    },
    formatAmount(amount, decimals = 1) {
      return `${new BigNumber(amount)
        .div(new BigNumber(10).pow(config.tokenDecimals))
        .toFixed(decimals)
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')} ${config.denom}`
    },
    capitalize(s) {
      if (typeof s !== 'string') return ''
      return s.charAt(0).toUpperCase() + s.slice(1)
    },
  },
}

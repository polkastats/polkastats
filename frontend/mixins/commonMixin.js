import { hexToU8a, isHex } from '@polkadot/util'
import { BigNumber } from 'bignumber.js'
import { gql } from 'graphql-tag'
import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { checkAddressChecksum } from 'web3-utils'
import moment from 'moment'
import { config } from '@/frontend.config.js'

export default {
  methods: {
    shortAddress(address) {
      return (
        address.substring(0, 5) + '…' + address.substring(address.length - 5)
      )
    },
    shortHash: (hash) =>
      `${hash.substring(0, 6)}…${hash.substring(hash.length - 4, hash.length)}`,
    formatNumber(number) {
      if (isHex(number)) {
        return parseInt(number, 16)
          .toString()
          .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      } else {
        return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
      }
    },
    formatAmount(amount, precission = 3, format = false) {
      const convertedAmount = new BigNumber(amount).div(
        new BigNumber(10).pow(config.tokenDecimals)
      )
      return format
        ? `${this.formatNumber(convertedAmount.toFixed(precission))} ${
            config.tokenSymbol
          }`
        : `${convertedAmount.toFixed(precission)} ${config.tokenSymbol}`
    },
    capitalize(s) {
      if (typeof s !== 'string') return ''
      return s.charAt(0).toUpperCase() + s.slice(1)
    },
    isBlockNumber(input) {
      const regexp = /^[0-9]*$/
      return regexp.test(input)
    },
    async isBlockHash(input) {
      // 0xadb2179b1666fef3b56a5762c3db0152b2a0a7f3d4b47737a355262609d867b9
      if (input.length === 66 && input.startsWith('0x')) {
        const client = this.$apollo.provider.defaultClient
        const query = gql`
          query block {
            block(limit: 1, where: {block_hash: {_eq: "${input}"}}) {
              block_number
            }
          }
        `
        const response = await client.query({ query })
        return response.data.block.length > 0
      }
      return false
    },
    async isExtrinsicHash(input) {
      // 0x3eab8af8321eb77e425396d029486739b7563965a4052211d5076a9e80f6010e
      if (input.length === 66 && input.startsWith('0x')) {
        const client = this.$apollo.provider.defaultClient
        const query = gql`
          query extrinsic {
            extrinsic(limit: 1, where: {hash: {_eq: "${input}"}}) {
              block_number
            }
          }
        `
        const response = await client.query({ query })
        return response.data.extrinsic.length > 0
      }
      return false
    },
    isHash(input) {
      // 0x3eab8af8321eb77e425396d029486739b7563965a4052211d5076a9e80f6010e
      if (input) {
        if (input.length === 66 && input.startsWith('0x')) {
          return true
        }
      }
      return false
    },
    isAddress(input) {
      const polkadotRegexp = /^(([0-9a-zA-Z]{47})|([0-9a-zA-Z]{48}))$/
      return polkadotRegexp.test(input)
    },
    getDateFromTimestamp(timestamp) {
      if (timestamp === 0) {
        return `--`
      }
      const date = moment.unix(timestamp / 1000)
      return `${date.utc().format('YYYY-MM-DD HH:mm:ss')} UTC`
    },
    isValidAddressPolkadotAddress: (address) => {
      try {
        encodeAddress(
          isHex(address) ? hexToU8a(address.toString()) : decodeAddress(address)
        )
        return true
      } catch (error) {
        return false
      }
    },
    isContractId: (contractId) => {
      if (!contractId) return false
      if (contractId.length !== 42) return false
      if (!checkAddressChecksum(contractId)) {
        return false
      }
      return true
    },
    fromNow(timestamp) {
      const date = moment.unix(timestamp / 1000)
      let diff = moment().diff(date, 'seconds')
      if (diff === 0) diff = 1
      let text

      if (diff >= 86400) {
        diff = Math.floor(diff / 60 / 60 / 24)
        if (diff === 1) text = 'day'
        else text = 'days'
      } else if (diff >= 3600) {
        diff = Math.floor(diff / 60 / 60)
        if (diff === 1) text = 'hour'
        else text = 'hours'
      } else if (diff >= 60) {
        diff = Math.floor(diff / 60)
        if (diff === 1) text = 'minute'
        else text = 'minutes'
      } else if (diff === 1) text = 'second'
      else text = 'seconds'

      return `${diff} ${text} ago`
    },
    uncapitalize: (str) => {
      return str.charAt(0).toLowerCase() + str.slice(1)
    },
    snakeToCamel: (str) => {
      if (!/[_-]/.test(str)) return str
      return str
        .toLowerCase()
        .replace(/([-_])([a-z])/g, (_match, _p1, p2) => p2.toUpperCase())
    },
  },
}

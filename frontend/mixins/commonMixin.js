import { hexToU8a, isHex } from '@polkadot/util'
import { BigNumber } from 'bignumber.js'
import { gql } from 'graphql-tag'
import { decodeAddress, encodeAddress } from '@polkadot/keyring'
import { checkAddressChecksum } from 'web3-utils'
import moment from 'moment'
import { network } from '@/frontend.config.js'
const base = new BigNumber(10).pow(network.tokenDecimals)

export default {
  methods: {
    shortAddress(address) {
      if (address.address20) {
        return this.shortAddress(address.address20)
      }
      return (
        address.substring(0, 5) + '…' + address.substring(address.length - 5)
      )
    },
    shortHash(hash) {
      return `${hash.substr(0, 6)}…${hash.substr(hash.length - 4, 4)}`
    },
    formatWithCommas(numberAsString) {
      return numberAsString.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
    },
    formatNumber(number) {
      if (isHex(number)) {
        return this.formatWithCommas(parseInt(number, 16).toString())
      } else {
        return this.formatWithCommas(number.toString())
      }
    },
    formatAmount(amount, precission = 2) {
      const tokensAmount = new BigNumber(amount).div(base).toFixed(precission)
      return `${this.formatWithCommas(tokensAmount.toString())} ${
        network.tokenSymbol
      }`
    },
    formatAmountToDecimal(amount) {
      return new BigNumber(amount).div(base).toNumber()
    },
    capitalize(s) {
      if (typeof s !== 'string') return ''
      return s.charAt(0).toUpperCase() + s.slice(1)
    },
    isBlockNumber(input) {
      const polkadotRegexp = /^[0-9]*$/
      return polkadotRegexp.test(input)
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
      const newDate = new Date()
      newDate.setTime(timestamp * 1000)
      return newDate.toUTCString()
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
    fromNow: (timestamp) => {
      const date = moment.unix(timestamp)
      return moment(date).fromNow()
    },
  },
}

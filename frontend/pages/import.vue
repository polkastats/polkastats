<template>
  <div class="page container-fluid pt-3">
    <div>
      <h1 class="mb-4 text-center">Import validator set</h1>
      <p class="mb-4 text-center">
        Import the validator set of any of your extension accounts to use as a
        base to customize your next validator set
      </p>
      <div v-if="loading">
        <Loading color="#fff" />
      </div>
      <div v-else>
        <div v-for="account in extensionAccounts" :key="account.address">
          <div class="row mx-0 mb-4" style="border: 1px solid gray">
            <div class="col-md-4 p-3">
              <Identicon :address="account.address" :size="24" />
              <span v-if="account.address">
                {{ account.name }} ({{ shortAddress(account.address) }})
              </span>
              <span v-else>
                {{ shortAddress(account.address) }}
              </span>
            </div>
            <div class="col-md-4 p-3">
              {{ account.role }}
            </div>
            <div class="col-md-4 p-3">
              {{ account.available }}
            </div>
          </div>
          <div v-if="account.staking" class="mb-4 pl-4">
            <h4 class="mb-4">Validator set:</h4>
            <div
              v-for="validator in account.staking.targets"
              :key="`${account.address}-${validator}`"
              class="d-block my-1"
            >
              <Validator :address="validator" />
            </div>
            <b-button
              variant="outline-primary2"
              class="my-4"
              @click="importSetFrom(account.address)"
              >IMPORT SET</b-button
            >
            <span
              >WARNING: Importing your on-chain nominations will replace your
              current selection in the Validator Resource Center!</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { encodeAddress } from '@polkadot/keyring'
import commonMixin from '@/mixins/commonMixin.js'
import { config } from '@/config.js'
export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
      detectedExtension: false,
      extensionAccounts: [],
      extensionAddresses: [],
      api: null,
      enableWeb3: false,
      error: null,
      noAccountsFound: true,
      loading: true,
    }
  },
  head() {
    return {
      title: `${config.title} for ${this.capitalize(config.name)}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: `${config.title} for ${this.capitalize(config.name)}`,
        },
      ],
    }
  },
  async created() {
    this.enableWeb3 = await web3Enable(
      `${config.title} for ${this.capitalize(config.name)}`
    )
      .then(() => {
        web3Accounts()
          .then((accounts) => {
            const wsProvider = new WsProvider(config.nodeWs)
            ApiPromise.create({ provider: wsProvider }).then(async (api) => {
              this.api = api
              if (accounts.length > 0) {
                this.detectedExtension = true
                for (const account of accounts) {
                  const address = encodeAddress(
                    account.address,
                    config.addressPrefix
                  )
                  const staking = await this.getStakingInfo(address)
                  if (staking?.targets.length > 0) {
                    const role = await this.getAddressRole(address)
                    const balances = await this.getAccountBalances(address)
                    this.extensionAccounts.push({
                      address,
                      name: account.meta.name,
                      role,
                      staking,
                      available: this.formatAmount(balances.availableBalance),
                      selected: false,
                    })
                  }
                }
                if (
                  this.extensionAccounts.length > 0 &&
                  this.extensionAddresses.length > 0
                ) {
                  this.noAccountsFound = false
                } else {
                  this.noAccountsFound = true
                }
                this.loading = false
              }
            })
          })
          .catch((error) => {
            // eslint-disable-next-line
            console.log('Error: ', error)
          })
      })
      .catch((error) => {
        // eslint-disable-next-line
        console.log('Error: ', error)
      })
  },
  methods: {
    async getAccountBalances(address) {
      const balances = await this.api.derive.balances.all(address)
      return balances
    },
    async getStakingInfo(address) {
      const staking = await this.api.query.staking.nominators(address)
      return JSON.parse(JSON.stringify(staking))
    },
    async getAddressRole(address) {
      const bonded = await this.api.query.staking.bonded(address)
      if (bonded.toString() && bonded.toString() === address) {
        return `stash/controller`
      } else if (bonded.toString() && bonded.toString() !== address) {
        return `stash`
      } else {
        const stakingLedger = await this.api.query.staking.ledger(address)
        if (stakingLedger.toString()) {
          return `controller`
        } else {
          return `none`
        }
      }
    },
    async selectAddress(address) {
      await this.$store.dispatch('ranking/updateSelectedAddress', address)
      this.$emit('close')
      return true
    },
    async importSetFrom(address) {
      const staking = await this.api.query.staking.nominators(address)
      const validators = JSON.parse(JSON.stringify(staking)).targets
      this.$store.dispatch('ranking/importValidatorSet', validators)
    },
  },
}
</script>

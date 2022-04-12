<template>
  <b-container fluid class="page py-5">
    <h1 class="mb-4 text-center">Nominate</h1>
    <div class="row">
      <div
        class="
          col-sm-10
          offset-sm-1
          col-md-10
          offset-md-1
          col-lg-6
          offset-lg-3
          col-xl-4
          offset-xl-4
        "
      >
        <div v-if="loading">
          <Loading />
        </div>
        <div v-else-if="!isWeb3Injected">
          <b-alert variant="warning" class="text-center" show>
            <i class="fa fa-frown-o"></i>
            <a href="https://github.com/polkadot-js/extension" target="_blank"
              >Polkadot JS extension</a
            >
            not found, please install it and import your account/s before
            proceed
          </b-alert>
        </div>
        <div v-else-if="!selectedAddress">
          <b-alert variant="warning" class="text-center" show>
            <i class="fa fa-frown-o"></i> Please, connect your extension account
            by clicking in the Connect button placed top right
          </b-alert>
        </div>
        <div v-else-if="selectedAddresses.length === 0">
          <b-alert variant="warning" class="text-center" show>
            <i class="fa fa-frown-o"></i> Please, add validators to your set
            before nominate
          </b-alert>
        </div>
        <div v-else>
          <div v-if="onGoingElection">
            <b-alert variant="warning" class="text-center" show>
              <i class="fa fa-frown-o"></i> There is currently an ongoing
              election for new validator candidates. Your nomination will be
              effective in the next era
            </b-alert>
          </div>
          <b-form class="mt-2" @submit="onSubmit">
            <b-form-group
              id="input-group-from"
              label-for="input-from"
              class="w-100 pt-4"
            >
              <p class="pt-4">Target validators:</p>
              <div
                v-for="validator in list"
                :key="`nominate-validator-${validator.stashAddress}`"
                class="row pb-1"
              >
                <div class="col-10">
                  <Identicon :address="validator.stashAddress" :size="20" />
                  <nuxt-link
                    :to="localePath(`/validator/${validator.stashAddress}`)"
                  >
                    <span v-if="validator.name">
                      {{ validator.name }}
                      <VerifiedIcon />
                    </span>
                    <span v-else>
                      {{ shortAddress(validator.stashAddress) }}
                    </span>
                  </nuxt-link>
                </div>
                <div class="col-2 text-right">
                  <a
                    v-b-tooltip.hover
                    href="#"
                    title="Remove"
                    class="remove"
                    @click.stop.prevent="remove(validator.stashAddress)"
                  >
                    <font-awesome-icon icon="times" />
                  </a>
                </div>
              </div>
            </b-form-group>
            <b-alert
              v-if="extrinsicHash && extrinsicStatus === 'Finalized'"
              variant="success"
              class="text-center"
              fade
              show
            >
              <h4>{{ extrinsicStatus }} transaction!</h4>
              <p>
                Extrinsic with hash {{ extrinsicHash }} was included in block
                <a
                  v-b-tooltip.hover
                  :href="`https://polkascan.io/kusama/block/${blockHash}`"
                  :title="$t('common.block_details')"
                  target="_blank"
                >
                  <Promised :promise="getBlockNumber(blockHash)">
                    <template #default="data"
                      >#{{ formatNumber(data) }}</template
                    >
                  </Promised>
                </a>
              </p>
            </b-alert>
            <b-alert
              v-else-if="
                extrinsicHash &&
                extrinsicStatus &&
                extrinsicStatus !== 'Finalized'
              "
              variant="info"
              class="text-center"
              fade
              show
              dismissible
            >
              <h4>Transaction hash {{ extrinsicHash }}</h4>
              <p>Transaction status: {{ extrinsicStatus }}</p>
            </b-alert>
            <b-alert v-if="clusterAlert" variant="warning" show dismissible>
              You have more than one member of the same cluster in your set. If
              there is a slash for a cluster operator, chances are high that
              many cluster members are affected and super-linear slashing occurs
            </b-alert>
            <b-button
              type="submit"
              variant="outline-primary2"
              class="btn-block mt-3"
              :disabled="!selectedAddress || selectedAddresses.length === 0"
            >
              Nominate
            </b-button>
          </b-form>
        </div>
      </div>
    </div>
  </b-container>
</template>

<script>
import {
  isWeb3Injected,
  web3Enable,
  web3FromAddress,
} from '@polkadot/extension-dapp'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { encodeAddress } from '@polkadot/keyring'
import { Promised } from 'vue-promised'
import commonMixin from '@/mixins/commonMixin.js'
import { config } from '@/frontend.config.js'

export default {
  components: { Promised },
  mixins: [commonMixin],
  data() {
    return {
      config,
      isWeb3Injected: false,
      allInjected: null,
      api: null,
      error: null,
      extrinsicHash: null,
      extrinsicStatus: null,
      blockHash: null,
      success: null,
      onGoingElection: false,
      clusterAlert: false,
    }
  },
  head() {
    return {
      title: this.$t('pages.nominate.head_title'),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.nominate.head_content'),
        },
      ],
    }
  },
  computed: {
    loading() {
      return this.$store.state.ranking.loading
    },
    list() {
      const list = this.$store.state.ranking.list.filter(
        ({ selected }) => selected
      )
      const vm = this
      list.forEach((validator) => {
        const includedClusterMembers = list.filter(
          ({ clusterName }) => clusterName === validator.clusterName
        )
        if (includedClusterMembers.length > 1) {
          vm.clusterAlert = true
        }
      })
      return list
    },
    selectedAddress() {
      return this.$store.state.ranking.selectedAddress
    },
    selectedAddresses() {
      return this.$store.state.ranking.selectedAddresses
    },
  },
  async created() {
    this.allInjected = await web3Enable(
      this.$t('pages.nominate.extension_agent', { networkName: config.name })
    )
    this.isWeb3Injected = isWeb3Injected
    const wsProvider = new WsProvider(config.nodeWs)
    this.api = await ApiPromise.create({ provider: wsProvider })
    await this.getElectionStatus()
  },
  methods: {
    onSubmit(evt) {
      evt.preventDefault()
      this.nominate()
    },
    async getBlockNumber(hash) {
      const { number } = await this.api.rpc.chain.getHeader(hash)
      return number
    },
    async getElectionStatus() {
      const chainElectionStatus =
        await this.api.query.electionProviderMultiPhase.currentPhase()
      this.onGoingElection =
        Object.getOwnPropertyNames(chainElectionStatus.toJSON())[0] !== 'off'
    },
    nominate() {
      const encodedAddress = encodeAddress(this.selectedAddress, 42)
      const vm = this
      web3FromAddress(this.selectedAddress)
        .then(async (injector) => {
          this.api.setSigner(injector.signer)
          const { nonce } = await this.api.query.system.account(
            this.selectedAddress
          )
          await this.api.tx.staking
            .nominate(vm.selectedAddresses)
            .signAndSend(
              encodedAddress,
              { nonce },
              ({ events = [], status }) => {
                vm.extrinsicStatus = status.type
                if (status.isInBlock) {
                  vm.extrinsicHash = status.asInBlock.toHex()
                } else if (status.isFinalized) {
                  vm.blockHash = status.asFinalized.toHex()
                }
              }
            )
        })
        .catch((error) => {
          // eslint-disable-next-line
          console.log('Error: ', error)
        })
    },
    remove(accountId) {
      this.$store.dispatch('ranking/toggleSelected', { accountId })
    },
  },
}
</script>

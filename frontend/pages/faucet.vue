<template>
  <div>
    <section class="container faucet-container py-5">
      <div>
        <b-row>
          <b-col cols="12">
            <h1>
              {{ $t('pages.faucet.title') }}
            </h1>
          </b-col>
        </b-row>
        <b-form-row class="mt-3 mb-5">
          <b-col cols="2">
            <select v-model="networkValue" class="custom-select">
              <option value="testnet">Testnet</option>
              <option value="qanet">QAnet</option>
              <option value="devnet">Devnet</option>
            </select>
          </b-col>
          <b-col cols="10">
            <b-form-input
              id="searchInput"
              v-model="address"
              type="search"
              placeholder="Account ID"
            />
            <span v-if="addressE" class="error"> {{ addressE }}</span>
          </b-col>
        </b-form-row>
        <b-row class="button-flex">
          <b-button
            :disabled="disableButton"
            class="send-button"
            @click="requestAsset"
          >
            <span>Send me test CERE tokens</span>
          </b-button>
        </b-row>
        <div>
          <b-alert
            :show="dismissCountDown"
            dismissible
            :variant="alertType"
            class="mt-3"
            @dismissed="dismissCountDown = 0"
            @dismiss-count-down="countDownChanged"
          >
            {{ alertMessage }}
          </b-alert>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import { network } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.attachFooterToBottom()
    })
  },
  beforeRouteLeave(to, from, next) {
    this.detachFooterFromBottom()
    next()
  },
  data() {
    return {
      network,
      networkValue: 'testnet',
      address: null,
      disableButton: false,
      dismissSecs: 10,
      dismissCountDown: 0,
      alertType: null,
      alertMessage: null,
      addressE: '',
    }
  },
  head() {
    return {
      title: this.$t('pages.faucet.head_title', {
        networkName: network.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.faucet.head_content', {
            networkName: network.name,
          }),
        },
      ],
    }
  },
  watch: {
    address(value) {
      if (value !== '') {
        this.addressE = this.isValidAddressPolkadotAddress(value)
          ? ''
          : 'Please enter a valid Account ID.'
      } else {
        this.addressE = ''
      }
    },
  },
  mounted() {
    this.attachFooterToBottom()
  },
  methods: {
    attachFooterToBottom() {
      this.setFooterStyles('fixed', '0', '9999')
    },
    detachFooterFromBottom() {
      this.setFooterStyles('', '', '')
    },
    setFooterStyles(position, bottom, zIndex) {
      const footer = document.getElementById('footer')
      if (footer) {
        footer.style.position = position
        footer.style.bottom = bottom
        footer.style.zIndex = zIndex
      }
    },
    requestAsset() {
      this.disableButton = true
      axios
        .post(`${network.backendHttp}/faucet`, {
          address: this.address,
          network: this.networkValue,
        })
        .then((response) => {
          if (response.status === 200) {
            this.alertType = 'success'
            this.alertMessage = `Congrats! Your transaction has been put in block successfully.
            Please wait about 15-20 seconds in order to transaction being
            finalized.`
            this.showAlert()
          }
        })
        .catch((error) => {
          if (error.response.status === 400 || error.response.status === 429) {
            this.alertType = 'danger'
            this.alertMessage = error.response.data.msg
            this.showAlert()
          }
        })
    },
    countDownChanged(dismissCountDown) {
      this.dismissCountDown = dismissCountDown
      if (this.dismissCountDown === 0) {
        this.address = null
        this.networkValue = 'testnet'
        this.disableButton = false
      }
    },
    showAlert() {
      this.dismissCountDown = this.dismissSecs
    },
  },
}
</script>

<style>
.address {
  border-radius: 10px;
}

.no-flex {
  display: block !important;
}

select {
  border-radius: 10px;
}

select:focus {
  border: 1px solid #495057 !important;
}

input:focus {
  border: 1px solid #495057 !important;
}

.button-flex {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 10px;
}

.send-button {
  border-radius: 10px;
  max-width: 250px;
  margin-right: 0 !important;
}

.error {
  color: red;
}
</style>

<template>
  <div>
    <section>
      <b-container class="main py-5">
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
          </b-col>
        </b-form-row>
        <b-row class="button-flex">
          <b-button
            :disabled="disableButton"
            class="button"
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
            class="mt-5"
            @dismissed="dismissCountDown = 0"
            @dismiss-count-down="countDownChanged"
          >
            {{ alertMessage }}
          </b-alert>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import { network } from '@/frontend.config.js'
export default {
  data() {
    return {
      network,
      networkValue: 'testnet',
      address: null,
      disableButton: false,
      dismissSecs: 5,
      dismissCountDown: 0,
      alertType: null,
      alertMessage: null,
    }
  },
  head() {
    return {
      title: this.$t('pages.faucet.head_title'),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.faucet.head_content'),
        },
      ],
    }
  },
  methods: {
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
          if (error.response.status === 400) {
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
}

.button {
  border-radius: 10px;
  max-width: 250px;
}
</style>

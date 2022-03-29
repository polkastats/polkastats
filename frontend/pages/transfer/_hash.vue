<template>
  <div>
    <section>
      <b-container class="transfer-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!transfer">
          <h1 class="text-center">Transfer not found!</h1>
        </template>
        <template v-else>
          <div class="card mt-4 mb-3">
            <div class="card-body">
              <h4 class="text-center mb-4">Transfer {{ shortHash(hash) }}</h4>
              <Transfer :transfer="transfer" />
              <ExtrinsicEvents
                :block-number="parseInt(transfer.block_number)"
                :extrinsic-index="parseInt(transfer.extrinsic_index)"
              />
            </div>
          </div>
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import ExtrinsicEvents from '@/components/ExtrinsicEvents.vue'

export default {
  components: {
    Loading,
    ExtrinsicEvents,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      hash: this.$route.params.hash,
      transfer: undefined,
    }
  },
  watch: {
    $route() {
      this.hash = this.$route.params.hash
    },
  },
  apollo: {
    transfer: {
      query: gql`
        query transfer($hash: String!) {
          transfer(where: { hash: { _eq: $hash } }) {
            block_number
            hash
            extrinsic_index
            section
            method
            source
            destination
            amount
            fee_amount
            success
            error_message
            timestamp
          }
        }
      `,
      skip() {
        return !this.hash
      },
      variables() {
        return {
          hash: this.hash,
        }
      },
      result({ data }) {
        this.transfer = data.transfer[0]
        this.loading = false
      },
    },
  },
}
</script>

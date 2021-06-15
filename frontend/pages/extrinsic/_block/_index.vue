<template>
  <div>
    <section>
      <b-container class="extrinsic-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!parsedExtrinsic">
          <h1 class="text-center">Extrinsic not found!</h1>
        </template>
        <template v-else>
          <div class="card mt-4 mb-3">
            <div class="card-body">
              <h4 class="text-center mb-4">
                Extrinsic {{ blockNumber }}-{{ extrinsicIndex }}
              </h4>
              <Extrinsic :extrinsic="parsedExtrinsic" />
            </div>
          </div>
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import gql from 'graphql-tag'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      blockNumber: this.$route.params.block,
      extrinsicIndex: this.$route.params.index,
      parsedExtrinsic: undefined,
    }
  },
  head() {
    return {
      title: 'Explorer | Reef Network',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reef Chain is an EVM compatible chain for DeFi',
        },
      ],
    }
  },
  watch: {
    $route() {
      this.blockNumber = this.$route.params.block
      this.extrinsicIndex = this.$route.params.index
    },
  },
  apollo: {
    extrinsic: {
      query: gql`
        query extrinsic($block_number: bigint!, $extrinsic_index: Int!) {
          extrinsic(
            where: {
              block_number: { _eq: $block_number }
              extrinsic_index: { _eq: $extrinsic_index }
            }
          ) {
            block_number
            extrinsic_index
            is_signed
            signer
            section
            method
            args
            hash
            doc
            fee_info
            fee_details
            success
            timestamp
          }
        }
      `,
      skip() {
        return !this.blockNumber || !this.extrinsicIndex
      },
      variables() {
        return {
          block_number: this.blockNumber,
          extrinsic_index: this.extrinsicIndex,
        }
      },
      result({ data }) {
        this.parsedExtrinsic = data.extrinsic[0]
        this.loading = false
      },
    },
  },
}
</script>

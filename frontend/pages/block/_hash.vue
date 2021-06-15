<template>
  <div>
    <section>
      <b-container class="block-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!parsedBlock">
          <h1 class="text-center">Block not found!</h1>
        </template>
        <template v-else>
          <Block
            :parsed-block="parsedBlock"
            :parsed-extrinsics="parsedExtrinsics"
            :parsed-events="parsedEvents"
          />
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import gql from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import Block from '@/components/Block.vue'

export default {
  components: {
    Loading,
    Block,
  },
  data() {
    return {
      loading: true,
      blockHash: this.$route.params.hash,
      blockNumber: this.$route.query.blockNumber,
      parsedBlock: undefined,
      parsedExtrinsics: [],
      parsedEvents: [],
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
      this.blockHash = this.$route.params.hash
    },
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription block($block_hash: String!) {
            block(where: { block_hash: { _eq: $block_hash } }) {
              block_author
              finalized
              block_author_name
              block_hash
              block_number
              extrinsics_root
              parent_hash
              state_root
              timestamp
              total_events
              total_extrinsics
            }
          }
        `,
        variables() {
          return {
            block_hash: this.blockHash,
          }
        },
        result({ data }) {
          if (data.block[0]) {
            this.blockNumber = data.block[0].block_number
            this.parsedBlock = data.block[0]
          }
          this.loading = false
        },
      },
      event: {
        query: gql`
          subscription event($block_number: bigint!) {
            event(where: { block_number: { _eq: $block_number } }) {
              block_number
              data
              event_index
              method
              phase
              section
            }
          }
        `,
        skip() {
          return !this.blockNumber
        },
        variables() {
          return {
            block_number: this.blockNumber,
          }
        },
        result({ data }) {
          this.parsedEvents = data.event
        },
      },
      extrinsic: {
        query: gql`
          subscription extrinsic($block_number: bigint!) {
            extrinsic(where: { block_number: { _eq: $block_number } }) {
              block_number
              extrinsic_index
              is_signed
              signer
              section
              method
              args
              hash
              doc
              success
            }
          }
        `,
        skip() {
          return !this.blockNumber
        },
        variables() {
          return {
            block_number: this.blockNumber,
          }
        },
        result({ data }) {
          this.parsedExtrinsics = data.extrinsic
        },
      },
    },
  },
}
</script>

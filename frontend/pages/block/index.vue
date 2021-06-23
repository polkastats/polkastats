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
import { gql } from 'graphql-tag'
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
      blockNumber: this.$route.query.blockNumber,
      parsedBlock: undefined,
      parsedExtrinsics: [],
      parsedEvents: [],
    }
  },
  head() {
    return {
      title: 'PolkaStats NG block explorer',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'PolkaStats block explorer',
        },
      ],
    }
  },
  watch: {
    $route() {
      this.blockNumber = this.$route.query.blockNumber
    },
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription block($block_number: bigint!) {
            block(where: { block_number: { _eq: $block_number } }) {
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
            block_number: this.$route.query.blockNumber,
          }
        },
        result({ data }) {
          if (data.block[0]) {
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
        variables() {
          return {
            block_number: this.$route.query.blockNumber,
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
        variables() {
          return {
            block_number: this.$route.query.blockNumber,
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

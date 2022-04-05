<template>
  <div>
    <section>
      <b-container class="block-page main py-5">
        <Block v-if="blockNumber" :block-number="blockNumber" />
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Block from '@/components/block/Block.vue'
export default {
  components: {
    Block,
  },
  data() {
    return {
      blockNumber: null,
      blockHash: this.$route.params.hash,
    }
  },
  head() {
    return {
      title: 'PolkaStats block explorer',
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
      this.blockHash = this.$route.params.hash
    },
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription block($block_hash: String!) {
            block(where: { block_hash: { _eq: $block_hash } }) {
              block_number
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
            this.blockNumber = '' + data.block[0].block_number
          }
        },
      },
    },
  },
}
</script>

<template>
  <div>
    <section>
      <b-container class="block-page main py-5">
        <Block :block-number="blockNumber" />
      </b-container>
    </section>
  </div>
</template>
<script>
import Block from '@/components/block/Block.vue'
import { config } from '@/frontend.config.js'

export default {
  components: {
    Block,
  },
  data() {
    return {
      blockNumber: this.$route.query.blockNumber,
    }
  },
  head() {
    return {
      title: this.$t('pages.block.head_title', {
        networkName: config.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.block.head_content', {
            networkName: config.name,
          }),
        },
      ],
    }
  },
  watch: {
    $route() {
      this.blockNumber = this.$route.query.blockNumber
    },
  },
}
</script>

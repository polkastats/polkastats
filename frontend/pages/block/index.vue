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
import Block from '@/components/Block.vue'

export default {
  components: {
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
}
</script>

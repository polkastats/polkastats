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
      blockNumber: this.$route.query.blockNumber,
    }
  },
  head() {
    return {
      title: 'Cere Network Stats',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Cere Network Stats',
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

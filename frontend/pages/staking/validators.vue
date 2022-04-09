<template>
  <div class="page container pt-3">
    <div>
      <Ranking />
    </div>
  </div>
</template>

<script>
import Ranking from '@/components/staking/Ranking.vue'
import { config } from '@/frontend.config.js'
export default {
  components: {
    Ranking,
  },
  head() {
    return {
      title: this.$t('pages.validators.head_title', {
        networkName: config.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.validators.head_content', {
            networkName: config.name,
          }),
        },
      ],
    }
  },
}
</script>

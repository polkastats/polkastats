<template>
  <div class="page container pt-3">
    <div>
      <Ranking />
    </div>
  </div>
</template>

<script>
import { network } from '@/frontend.config.js'
export default {
  head() {
    return {
      title: this.$t('pages.validators.head_title', {
        networkName: network.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.validators.head_content', {
            networkName: network.name,
          }),
        },
      ],
    }
  },
}
</script>

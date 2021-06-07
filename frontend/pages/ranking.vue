<template>
  <div class="page container-fluid pt-3">
    <div>
      <Featured />
      <Ranking />
    </div>
  </div>
</template>

<script>
import { config } from '@/config.js'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
    }
  },
  head() {
    return {
      title: `${config.title} for ${this.capitalize(config.name)}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: `${config.title} for ${this.capitalize(config.name)}`,
        },
      ],
    }
  },
}
</script>

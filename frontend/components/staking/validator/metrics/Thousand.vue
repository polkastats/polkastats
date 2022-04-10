<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">{{ $t('components.thousand.title') }}</h5>
      </div>
      <div class="col-4 text-right text-success"></div>
    </div>
    <div class="description">
      {{
        $t('components.thousand.description_1', { thousandRank: thousand.rank })
      }}
      <a href="https://thousand-validators.kusama.network/#/" target="_blank">{{
        $t('components.thousand.description_2', {
          networkName: config.networkName,
        })
      }}</a
      >{{ $t('components.thousand.description_3') }}
      <a
        :href="`https://thousand-validators.kusama.network/#/leaderboard/${accountId}`"
        target="_blank"
        >{{ $t('components.thousand.description_4') }}</a
      >.
      <!-- <pre>{{ JSON.stringify(thousand, null, 2) }}</pre> -->
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import { config } from '@/frontend.config.js'

export default {
  mixins: [commonMixin],
  props: {
    accountId: {
      type: String,
      default: () => '',
    },
    thousand: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      config,
    }
  },
}
</script>

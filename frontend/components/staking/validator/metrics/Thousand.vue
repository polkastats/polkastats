<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">Thousand Validator Program</h5>
      </div>
      <div class="col-4 text-right text-success"></div>
    </div>
    <div class="description">
      Validator is ranked #{{ thousand.rank }} in the
      <a href="https://thousand-validators.kusama.network/#/" target="_blank"
        >Kusama Thousand Validator Program</a
      >, check its
      <a
        :href="`https://thousand-validators.kusama.network/#/leaderboard/${accountId}`"
        target="_blank"
        >thousand validator profile page</a
      >.
      <!-- <pre>{{ JSON.stringify(thousand, null, 2) }}</pre> -->
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'

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
}
</script>

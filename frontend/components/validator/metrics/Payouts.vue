<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          Frequency of payouts
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#payouts"
            title="Evaluate frequency of rewards distribution"
          >
            <font-awesome-icon
              icon="question-circle"
              class="d-inline-block"
              style="font-size: 1rem"
            />
          </nuxt-link>
        </h5>
      </div>
      <div class="col-4 text-right text-success">
        <Rating key="payouts" :rating="rating" />
      </div>
    </div>
    <div class="description">
      <p v-if="rating === 3">
        Very good, validator has {{ pending }} unclaimed era rewards
      </p>
      <p v-else-if="rating === 2">
        Good, validator has {{ pending }} unclaimed era rewards
      </p>
      <p v-else-if="rating === 1">
        Neutral, validator has {{ pending }} unclaimed era rewards
      </p>
      <p v-else>No payouts detected in the last week</p>
    </div>
  </div>
</template>
<script>
import { network } from '@/frontend.config.js'
export default {
  props: {
    payoutHistory: {
      type: Array,
      default: () => [],
    },
    rating: {
      type: Number,
      default: () => 0,
    },
  },
  data() {
    return {
      network,
    }
  },
  computed: {
    pending() {
      return this.payoutHistory.filter((payout) => payout.status === 'pending')
        .length
    },
  },
}
</script>

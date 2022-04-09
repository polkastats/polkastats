<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          Commission
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#commission"
            title="Evaluate validator commission over time"
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
        <Rating key="commission" :rating="rating" />
      </div>
    </div>
    <div class="description">
      <p v-if="!isNaN(commission)">
        Current commission is {{ commission.toFixed(2) }}%
      </p>
    </div>
  </div>
</template>
<script>
import Rating from '@/components/staking/Rating.vue'

export default {
  components: {
    Rating,
  },
  props: {
    commission: {
      type: Number,
      default: () => 0,
    },
    commissionHistory: {
      type: Array,
      default: () => [],
    },
    rating: {
      type: Number,
      default: () => 0,
    },
  },
}
</script>

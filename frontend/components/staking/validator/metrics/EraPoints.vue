<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          {{ $t('components.era_points.title') }}
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#erapoints"
            :title="$t('components.era_points.help')"
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
        <Rating key="erapoints" :rating="rating" />
      </div>
    </div>
    <div class="description">
      <p v-if="rating === 2">
        {{
          $t('components.address.description_1', {
            percent: percent.toFixed(2),
            average: average.toFixed(2),
          })
        }}<br />
      </p>
      <p v-else>
        {{
          $t('components.address.description_2', {
            percent: percent.toFixed(2),
            average: average.toFixed(2),
          })
        }}<br />
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
    rating: {
      type: Number,
      default: () => 0,
    },
    eraPointsHistory: {
      type: Array,
      default: () => [],
    },
    average: {
      type: Number,
      default: () => 0,
    },
    percent: {
      type: Number,
      default: () => 0,
    },
  },
}
</script>

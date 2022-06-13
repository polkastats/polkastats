<template>

	<rating-item :title="$t('components.commission.title')" :score="rating">
		<nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#commission"
            :title="$t('components.commission.help')"
			class="legend-link h6"
		>
            <font-awesome-icon icon="question-circle" />
		</nuxt-link>

		<div>
			<p v-if="!isNaN(commission)">
				{{ $t('components.commission.description_1') }}
				{{ commission.toFixed(2) }}%
			</p>
		</div>
	</rating-item>

  <!-- <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          {{ $t('components.commission.title') }}
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#commission"
            :title="$t('components.commission.help')"
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
        {{ $t('components.commission.description_1') }}
        {{ commission.toFixed(2) }}%
      </p>
    </div>
  </div> -->
</template>
<script>
// import Rating from '@/components/staking/Rating.vue'
import RatingItem from '@/components/more/RatingItem.vue'

export default {
  components: {
    // Rating,
	RatingItem
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

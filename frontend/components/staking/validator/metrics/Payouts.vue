<template>

	<rating-item :title="$t('components.payouts.title')" :score="rating">
		<nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#payouts"
            :title="$t('components.payouts.help')"
			class="legend-link h6"
		>
            <font-awesome-icon icon="question-circle" />
		</nuxt-link>

		<div>
			<p v-if="rating === 3">
				{{ $t('components.payouts.description_1', { pending }) }}
			</p>
			<p v-else-if="rating === 2">
				{{ $t('components.payouts.description_2', { pending }) }}
			</p>
			<p v-else-if="rating === 1">
				{{ $t('components.payouts.description_3', { pending }) }}
			</p>
			<p v-else>{{ $t('components.payouts.description_4') }}</p>
		</div>
	</rating-item>

  <!-- <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          {{ $t('components.payouts.title') }}
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#payouts"
            :title="$t('components.payouts.help')"
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
        {{ $t('components.payouts.description_1', { pending }) }}
      </p>
      <p v-else-if="rating === 2">
        {{ $t('components.payouts.description_2', { pending }) }}
      </p>
      <p v-else-if="rating === 1">
        {{ $t('components.payouts.description_3', { pending }) }}
      </p>
      <p v-else>{{ $t('components.payouts.description_4') }}</p>
    </div>
  </div> -->
</template>
<script>
// import Rating from '@/components/staking/Rating.vue'
import { config } from '@/frontend.config.js'
import RatingItem from '@/components/more/RatingItem.vue'

export default {
  components: {
    // Rating,
	RatingItem
  },
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
      config,
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

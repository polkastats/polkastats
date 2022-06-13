<template>

	<rating-item :title="$t('components.governance.title')" :score="rating">
		<nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#governance"
            :title="$t('components.governance.help')"
			class="legend-link h6"
		>
            <font-awesome-icon icon="question-circle" />
		</nuxt-link>

		<div>
			<p v-if="councilBacking && active">
				{{ $t('components.governance.description_1') }}
			</p>
			<p v-else-if="councilBacking && !active">
				{{ $t('components.governance.description_2') }}
			</p>
			<p v-else-if="!councilBacking && active">
				{{ $t('components.governance.description_3') }}
			</p>
			<p v-else>{{ $t('components.governance.description_4') }}</p>
		</div>
	</rating-item>

  <!-- <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          {{ $t('components.governance.title') }}
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#governance"
            :title="$t('components.governance.help')"
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
        <Rating key="governance" :rating="rating" />
      </div>
    </div>
    <div class="description">
      <p v-if="councilBacking && active">
        {{ $t('components.governance.description_1') }}
      </p>
      <p v-else-if="councilBacking && !active">
        {{ $t('components.governance.description_2') }}
      </p>
      <p v-else-if="!councilBacking && active">
        {{ $t('components.governance.description_3') }}
      </p>
      <p v-else>{{ $t('components.governance.description_4') }}</p>
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
    councilBacking: {
      type: Boolean,
      default: () => false,
    },
    active: {
      type: Boolean,
      default: () => false,
    },
    rating: {
      type: Number,
      default: () => 0,
    },
  },
}
</script>

<template>
	<rating-item :title="$t('components.slashes.title')" :score="rating">
		<nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#slashes"
            :title="$t('components.slashes.help')"
			class="legend-link h6"
		>
            <font-awesome-icon icon="question-circle" />
		</nuxt-link>

		<div>
			<p v-if="rating > 0">{{ $t('components.slashes.description_1') }}</p>
			<p v-else>{{ $t('components.slashes.description_2') }}</p>
		</div>

	</rating-item>

  <!-- <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          {{ $t('components.slashes.title') }}
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#slashes"
            :title="$t('components.slashes.help')"
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
        <Rating key="slashes" :rating="rating" />
      </div>
    </div>
    <div class="description">
      <p v-if="rating > 0">{{ $t('components.slashes.description_1') }}</p>
      <p v-else>{{ $t('components.slashes.description_2') }}</p>
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
    slashes: {
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

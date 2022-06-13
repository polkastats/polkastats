<template>

	<rating-item :title="$t('components.nominators.title')" :score="rating">
		<nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#nominators"
            :title="$t('components.nominators.help')"
			class="legend-link h6"
		>
            <font-awesome-icon icon="question-circle" />
		</nuxt-link>

		<div>
			<p v-if="rating > 0">
				{{ $t('components.nominators.description_1', { nominators }) }}
				<span v-if="nominators > 1">s</span>,
				{{ $t('components.nominators.description_2') }}
			</p>
			<p v-else-if="rating === 0 && nominators > 0">
				{{ $t('components.nominators.description_3', { nominators }) }}
			</p>
			<p v-else>{{ $t('components.nominators.description_4') }}</p>
		</div>
	</rating-item>

  <!-- <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          {{ $t('components.nominators.title') }}
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#nominators"
            :title="$t('components.nominators.help')"
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
        <Rating key="nominators" :rating="rating" />
      </div>
    </div>
    <div class="description">
      <p v-if="rating > 0">
        {{ $t('components.nominators.description_1', { nominators })
        }}<span v-if="nominators > 1">s</span>,
        {{ $t('components.nominators.description_2') }}
      </p>
      <p v-else-if="rating === 0 && nominators > 0">
        {{ $t('components.nominators.description_3', { nominators }) }}
      </p>
      <p v-else>{{ $t('components.nominators.description_4') }}</p>
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
    nominators: {
      type: Number,
      default: () => 0,
    },
    rating: {
      type: Number,
      default: () => 0,
    },
  },
}
</script>

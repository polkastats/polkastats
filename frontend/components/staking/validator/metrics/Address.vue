<template>

	<rating-item :title="$t('components.address.title')" :score="rating">

		<nuxt-link
			v-b-tooltip.hover
			to="/help/metrics#address"
			:title="$t('components.address.help')"
			class="legend-link h6"
		>
			<font-awesome-icon icon="question-circle" />
		</nuxt-link>

		<div>
			{{ $t('components.address.description_1') }} #{{ formatNumber(createdAtBlock) }}
			<span v-if="identity.parent">
				{{ $t('components.address.description_2') }} #{{ formatNumber(parentCreatedAtBlock) }}
			</span>
		</div>

	</rating-item>

  <!-- <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          {{ $t('components.address.title') }}
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#address"
            :title="$t('components.address.help')"
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
        <Rating key="address" :rating="rating" />
      </div>
    </div>
    <div class="description">
      {{ $t('components.address.description_1') }} #{{
        formatNumber(createdAtBlock)
      }}
      <span v-if="identity.parent">
        {{ $t('components.address.description_2') }} #{{
          formatNumber(parentCreatedAtBlock)
        }}
      </span>
    </div>
  </div> -->
</template>

<script>
// import Rating from '@/components/staking/Rating.vue'
import commonMixin from '@/mixins/commonMixin.js'
import RatingItem from '@/components/more/RatingItem.vue'

export default {
  components: {
    // Rating,
	RatingItem
  },
  mixins: [commonMixin],
  props: {
    accountId: {
      type: String,
      default: () => '',
    },
    identity: {
      type: Object,
      default: () => {},
    },
    rating: {
      type: Number,
      default: () => 0,
    },
    createdAtBlock: {
      type: Number,
      default: () => 0,
    },
    parentCreatedAtBlock: {
      type: Number,
      default: () => 0,
    },
  },
}
</script>

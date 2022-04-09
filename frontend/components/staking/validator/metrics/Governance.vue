<template>
  <div class="metric h-100">
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
  </div>
</template>
<script>
import Rating from '@/components/staking/Rating.vue'

export default {
  components: {
    Rating,
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

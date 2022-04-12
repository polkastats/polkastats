<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          {{ $t('components.subaccounts.title') }}
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#subaccounts"
            :title="$t('components.subaccounts.help')"
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
        <Rating key="subaccounts" :rating="rating" />
      </div>
    </div>
    <div class="description">
      <p v-if="rating > 0">
        {{ $t('components.subaccounts.description_1')
        }}<span v-if="clusterMembers > 1">{{
          $t('components.subaccounts.description_2', { clusterMembers })
        }}</span>
      </p>
      <p v-else>{{ $t('components.subaccounts.description_3') }}</p>
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
    clusterMembers: {
      type: Number,
      default: () => 0,
    },
  },
}
</script>

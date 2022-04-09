<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          Governance
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#governance"
            title="Evaluate if the validator is backing a council member and if is participating in a current proposal or referendum (as proposer or voter)"
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
        The validator is backing a council member and is participating in a
        active democracy proposal or refererendum
      </p>
      <p v-else-if="councilBacking && !active">
        The validator is backing a council member
      </p>
      <p v-else-if="!councilBacking && active">
        The validator is participating in a active democracy proposal or
        refererendum
      </p>
      <p v-else>The validator is not participating in governance</p>
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

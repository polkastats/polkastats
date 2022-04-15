<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          Slashes
          <nuxt-link
            v-b-tooltip.hover
            event=""
            to="/"
            title="Evaluate if the validator was slashed in the last 84 eras (12 weeks)"
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
      <p v-if="rating > 0">No slashes detected</p>
      <p v-else>Validator was slashed</p>
    </div>
  </div>
</template>
<script>
export default {
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

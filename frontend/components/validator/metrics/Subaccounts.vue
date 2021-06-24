<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          Subaccounts
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#subaccounts"
            title="Evaluate if the validator uses sub-accounts"
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
        Detected sub-identity<span v-if="clusterMembers > 1"
          >, the validator is part of a cluster of
          {{ clusterMembers }} validators</span
        >
      </p>
      <p v-else>No sub-identity detected</p>
    </div>
  </div>
</template>
<script>
export default {
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

<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          Era points
          <nuxt-link
            v-b-tooltip.hover
            event=""
            to="/"
            title="Evaluate if the era points earned by the validator in the history are below or above average"
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
        <Rating key="erapoints" :rating="rating" />
      </div>
    </div>
    <div class="description">
      <p v-if="rating === 2">
        Above average! Validator got {{ percent.toFixed(2) }}% of the total era
        points in the last 16 days while average was
        {{ average.toFixed(2) }}%<br />
      </p>
      <p v-else>
        Below average! Validator got {{ percent.toFixed(2) }}% of the total era
        points in the last 16 days while average was
        {{ average.toFixed(2) }}%<br />
      </p>
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
    eraPointsHistory: {
      type: Array,
      default: () => [],
    },
    average: {
      type: Number,
      default: () => 0,
    },
    percent: {
      type: Number,
      default: () => 0,
    },
  },
}
</script>

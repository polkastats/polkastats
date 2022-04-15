<template>
  <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          Address creation
          <nuxt-link
            v-b-tooltip.hover
            event=""
            to="/"
            title="Evaluate how old is the validator address"
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
      Stash address was created at block #{{ formatNumber(createdAtBlock) }}
      <span v-if="identity.parent">
        and parent identity address was created at block #{{
          formatNumber(parentCreatedAtBlock)
        }}
      </span>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
export default {
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

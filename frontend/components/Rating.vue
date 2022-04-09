<template>
  <div class="rating">
    <span v-if="rating === 3" class="text-success">
      <font-awesome-icon icon="check" />
      {{ $t('components.rating.very_good') }}
    </span>
    <span v-else-if="rating === 2" class="text-success">
      <font-awesome-icon icon="check" />
      {{ $t('components.rating.good') }}
    </span>
    <span v-else-if="rating === 1" class="text-warning">
      <font-awesome-icon icon="check" />
      {{ $t('components.rating.neutral') }}
    </span>
    <span v-else-if="rating === 0" class="text-danger">
      <font-awesome-icon icon="times" />
      {{ $t('components.rating.bad') }}
    </span>
    <span v-else class="text-secondary">
      <font-awesome-icon :icon="['fas', 'spinner']" class="fa-pulse" />
      {{ $t('components.rating.loading') }}...
    </span>
  </div>
</template>
<script>
export default {
  props: {
    rating: {
      type: Number,
      default: () => -1,
    },
  },
}
</script>

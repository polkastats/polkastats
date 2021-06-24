<template>
  <span v-b-tooltip.hover title="Verified identity">
    <font-awesome-layers :class="`fa-${size} align-middle verified`">
      <font-awesome-icon icon="circle" class="circle" />
      <font-awesome-icon icon="check" transform="shrink-6" />
    </font-awesome-layers>
  </span>
</template>
<script>
export default {
  props: {
    size: {
      type: String,
      default: () => 'md',
    },
  },
}
</script>

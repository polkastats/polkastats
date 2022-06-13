<template>
	<span v-if="unclass" v-b-tooltip.hover title="Verified identity" :class="'text-' + size" class="bg-i-succsessB text-i-fifth rounded-circle">
		<font-awesome-layers :class="`fa-${size} align-middle verified`">
			<font-awesome-icon icon="circle" class="text-i-successB" />
			<font-awesome-icon icon="check" transform="shrink-8" />
		</font-awesome-layers>
	</span>
  <span v-else v-b-tooltip.hover title="Verified identity">
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
	unclass: { type: Boolean }
  },
}
</script>

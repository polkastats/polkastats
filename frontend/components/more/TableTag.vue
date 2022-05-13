
<template>
	<span>
		<b class="d-inline-block align-middle">
			<span v-if="title" class="d-block">{{ title }}</span>
			<span v-if="value" class="h6">{{ value }}</span>
		</b>
		<b-badge class="rounded-0 ml-2 align-middle" :variant="variant" style="padding: 1em;">
			<font-awesome-icon :icon="icon" />
		</b-badge>
	</span>
</template>

<script>

export default {
	props:
	{
		variant: { type: String, default: 'i-primary' },
		title: { type: String },
		value: { type: String },
		icon: { type: String, default: 'filter' },
	}
}
</script>
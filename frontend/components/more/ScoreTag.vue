<template>
	<article class="text-nowrap">
		<b-badge class="py-2 px-3" :variant="variant">
			<font-awesome-icon class="h5 my-2" :icon="icon" />
		</b-badge>
		<h4 v-if="value" class="my-1">{{ value }}</h4>
		<p v-if="title" class="text-uppercase">{{ title }}</p>
	</article>
</template>

<script>

export default {
	props:
	{
		variant: { type: String, default: 'i-fourth' },
		icon: { type: String, default: 'signature' },
		title: String,
		value: String,
	}
}
</script>
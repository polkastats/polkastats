
<template>
	<details class="accordion pkd-list" :type="type" :variant="variant" :color="color">
		<summary class="accordion-header list-item p-2 text-lg">
			<b-badge v-if="label" class="mr-1 text-sm" :variant="variant">{{ label }}</b-badge>
			{{ title }}
			<b-badge :variant="variant" class="summary-arrow float-right text-sm">
				<font-awesome-icon open icon="plus" />
				<font-awesome-icon close icon="minus" />
			</b-badge>
		</summary>
		<article v-if="$slots" class="px-4 py-3">
			<slot />
		</article>
	</details>
</template>

<script>

export default {
	props:
	{
		title: { type: String, require: true },
		label: { type: String },
		type: { type: String, default: 'number' },
		variant: { type: String, default: 'i-primary' },
		color: { type: String, default: 'i-fifth' },
	},
}
</script>
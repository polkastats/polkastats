<template>
	<b-row class="spec-item align-items-center mx-0 mb-2" v-if="title">
		<b-col v-if="title" class="spec-title p-2" :variant="color" :cols="$attrs.cols || '12'" :sm="$attrs.sm || 2" v-bind="$attrs">
			<font-awesome-icon v-if="icon" :icon="icon" class="mr-1" />
			{{ title }}
		</b-col>
		<template v-if="multi">
			<slot />
		</template>
		<template v-else>
			<b-col class="spec-content p-2" :variant="variant">
				<slot />
			</b-col>
		</template>
	</b-row>
	<b-col v-else class="spec-content flex-grow-1 p-2" :variant="variant" :cols="$attrs.cols || '12'" :sm="$attrs.sm || 'auto'" v-bind="$attrs">
		<slot />
	</b-col>
</template>

<script>

export default {
	props:
	{
		variant: { type: String, default: 'i-fifth' },
		color: { type: String, default: 'i-fourth' },
		icon: String,
		title: String,
		multi: Boolean,
	}
}
</script>
<template>
	<p>
		<label v-if="label" class="mb-1 text-uppercase">{{ label }}</label>
		<b-input-group>
			<b-form-input :value="value" @input="$emit('input', $event)" :placeholder="placeholder" control="text" :variant="variant" :size="size" />
			<b-input-group-append v-if="icon" class="mr-2" p-absolute="right">
				<font-awesome-icon :icon="icon" :class="'text-' + variant" />
			</b-input-group-append>
		</b-input-group>
	</p>
</template>

<script>


export default {
	props: 
	{
		value: null,
		placeholder: String,
		variant: { default: 'i-primary' },
		size: { default: 'sm' },
		icon: String,
		label: String
	}
}
</script>
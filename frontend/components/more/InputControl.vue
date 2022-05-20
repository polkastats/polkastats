<template>
	<p>
		<label v-if="label" class="mb-1">{{ label }}</label>
		<b-input-group v-if="kind == 'text'">
			<b-form-input :value="value" @input="$emit('input', $event)" :placeholder="placeholder" control="text" :variant="variant" :size="size" />
			<b-input-group-append v-if="icon" class="mr-2" p-absolute="right">
				<font-awesome-icon :icon="icon" />
			</b-input-group-append>
		</b-input-group>
		<b-form-select v-else-if="kind == 'select'" :variant="variant"
			v-model="value"
			:options="options"
			@change="$emit('input', $event)"
		></b-form-select>
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
		label: String,
		kind: { type: String, default: 'text' },
		options: {}
	}
}
</script>
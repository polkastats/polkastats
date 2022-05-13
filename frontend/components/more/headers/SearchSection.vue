<template>
	<section class="section" :color="variant">

		<header class="mb-5 text-center" v-if="title">
			<h1 :class="'h3 text-uppercase font-weight-bold text-' + color">
				{{ title }}
			</h1>
			<h2 v-if="subtitle" class="h6 font-weight-normal">{{ subtitle }}</h2>
		</header>

		<article>
			<input-control
				:placeholder="placeholder"
				icon="search"
				:variant="color"
				v-model="value"
				:label="label"
				@input="$emit('input', $event)"
			/>
			<slot />
		</article>
		
	</section>
</template>

<script>
import InputControl from '@/components/more/InputControl.vue'

export default {
	props: 
	{
		title: String,
		subtitle: String,
		placeholder: String,
		label: String,
		value: null,
		variant: { default: 'i-fourth' },
		color: { default: 'i-primary' }
	},
	components: { InputControl }
}
</script>
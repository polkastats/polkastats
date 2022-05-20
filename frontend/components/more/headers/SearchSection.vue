<template>
	<section class="section section-search" :class="'text-' + text" :color="variant">

		<header class="text-center" v-if="title">
			<h1 class="h3 text-uppercase font-weight-normal" :class="'texst-' + color">{{ title }}</h1>
			<h2 v-if="subtitle" class="h6 font-weight-normal">{{ subtitle }}</h2>
			<input-control v-if="placeholder"
				class="mt-3 text-left"
				:placeholder="placeholder"
				icon="search"
				:variant="color"
				v-model="value"
				:label="label"
				@input="$emit('input', $event)"
			/>
		</header>

		<article class="text-center">
			<slot />
			<div class="mt-3" v-if="results !== undefined">
				{{ $t('components.ranking.search_results') }}:
				<b>{{ results }}</b>
			</div>
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
		variant: { default: 'i-primary' },
		color: { default: 'i-fourth' },
		text: { default: 'i-fifth' },
		results: undefined,
	},
	components: { InputControl }
}
</script>
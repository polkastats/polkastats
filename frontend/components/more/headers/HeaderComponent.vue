<template>
	<fragment>
		<header class="section section-header" v-bind="$props">
			<slot />
		</header>
		<AdsSection v-if="ads" v-bind="ads" />
	</fragment>
</template>

<script>
import AdsSection from '@/components/more/AdsSection.vue'
import { Fragment } from 'vue-fragment'

export default {
	components: { AdsSection, Fragment },
	props:
	{
		color: { type: String, default: 'i-gradient-primary' },
		background: { type: String, default: 'cubes' },
		type: { type: String },
		ads: { type: Object, default: { color: 'i-primary' } },
	}
}
</script>
<template>
	<fragment>
		<header class="section" :class="iclass" v-bind="$props">
			<slot />
		</header>
		<slot name="sections" />
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
		iclass: { type: String },
		color: { type: String, default: 'i-gradient-primary-5' },
		image: { type: String, default: 'cubes' },
		type: { type: String },
		ads: { type: Object, default: { color: 'i-primary' } },
	}
}
</script>
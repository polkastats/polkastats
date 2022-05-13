<template>
	<fragment>
		<header class="section section-header" :color="variant" :background="background">
			<slot name="inside" />
		</header>
		<slot />
		<AdsSection v-if="ads" />
	</fragment>
</template>

<script>
import AdsSection from '@/components/more/AdsSection.vue'
import { Fragment } from 'vue-fragment'

export default {
	components: { AdsSection, Fragment },
	props:
	{
		ads: { type: Boolean, default: true },
		variant: { type: String, default: 'i-third' },
		background: { type: String, default: 'cubes' },
	}
}
</script>
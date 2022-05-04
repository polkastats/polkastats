<template>
	<header class="section section-header" :color="variant" :background="background">
		<CoinZillaBanner class="ad-banner" />
		<slot />
	</header>
</template>

<script>
import CoinZillaBanner from '@/components/CoinZillaBanner.vue'

export default {
	components: { CoinZillaBanner },
	props:
	{
		variant: { type: String, default: 'i-gradient-third' },
		background: { type: String, default: 'cubes' },
	}
}
</script>
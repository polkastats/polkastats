
<template>
	<section class="section ads-section text-i-fifth py-4" :color="variant">
		<!-- <article class="section d-xl-blsock my-n4 py-4 flex-grow-1" :color="variant" pos="right">
			<h1 class="mb-2">Ad Space</h1>
			<b-button :variant="color">Contact</b-button>
		</article> -->
		<article class="m-auto overflow-hidden" style="line-height: 0;">
			<CoinZillaBanner effect="gray" />
		</article>
	</section>
</template>

<script>
import CoinZillaBanner from '@/components/CoinZillaBanner.vue'

export default {
	props:
	{
		variant: { type: String, default: 'i-fourth' },
		color: { type: String, default: 'i-primary' },
	},
	components: { CoinZillaBanner }
}
</script>
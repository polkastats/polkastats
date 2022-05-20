
<template>
	<section class="section ads-section text-i-fifth py-4" :color="variant">
		<article v-if="$slots.adInfo" class="section ad d-none d-xl-block my-n4 py-4 flex-grow-1" :color="variant" pos="right">
			<slot name="adInfo" />
		</article>
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
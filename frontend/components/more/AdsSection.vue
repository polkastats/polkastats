
<template>
	<section class="section ads-section" :color="variant">
		<article class="section ad d-none d-xl-block" :color="variant" pos="right">
			<h1	>Advertising Space</h1>
			<b-button class="mt-2" :variant="variant">Contact Us</b-button>
		</article>
		<article class="section ad m-auto" :color="variant">
			<CoinZillaBanner />
			<iframe class="ad-banner" width="728" height="90" src="https://request-global.czilladx.com/serve/view.php?w=728&h=90&z=8046256aaece3cc5291&c=712626fbeee41ba887&n=09969eb88d22a4e4b4862c990aa9f143a667dccc562894ef04f578386ce80ec0&integrity=eyJrZXkiOiJiYjk2MTRiMjE0ZjIyYzk0MjJmMmY0NWFmNjgzNjYxMWM3ZDI0MWI5YjcxOGM4NzA4YTRiNDAzNTk2NTZhOGMwIiwidGltZXN0YW1wIjoxNjUyMzU1ODQ1LjQ2MDc3LCJpZGVudGlmaWVyIjoiODUzMjMyYWM3Yzg3YTQ4NjJlMDZiYzcyZWQ5OGFkNWI5ODNlYjFiNzJmOWM1NThlNDUxM2YzY2YxNTk1YTQ3MSJ9" frameborder="0"></iframe>
			<!-- <iframe class="ad-banner" width="728" height="90" src="https://request-global.czilladx.com/serve/view.php?w=728&h=90&z=8046256aaece3cc5291&c=52625fd0353f26924&n=a580daee67129395e192e96c6afd4d0b59e6995255d50a31a5c3ceeca2533c32&integrity=eyJrZXkiOiI3ZGUwNjhmNzA2ZWY2NjY0NjEyMzU4MThjOThmZmRiNWU1OWE4NGFhOGM2NmQyY2ZkZjJmZDkzYzg2ZGMyZWMwIiwidGltZXN0YW1wIjoxNjUyMTA1OTk5LjMzMDQ2NiwiaWRlbnRpZmllciI6ImMwMjg0NDY0NTljYzgzZWQ5YTEyYzY1Zjk4ZWY3YWYwYTk0NGZiOWVmOGYwNWE0NzM5N2YxMmZkMjYzODBkYWMifQ" frameborder="0"></iframe> -->
		</article>
	</section>
</template>

<script>
import CoinZillaBanner from '@/components/CoinZillaBanner.vue'

export default {
	props:
	{
		variant: { type: String, default: 'i-primary' }
	},
	components: { CoinZillaBanner }
}
</script>
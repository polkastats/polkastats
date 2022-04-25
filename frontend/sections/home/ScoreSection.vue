
<template>
	<section class="section scores">
		<header></header>
		<!-- <header>
			<h1>
				<a href="#">
					<span>
						<img src="/brand/logo.svg" alt="Brand Logo" height="40">
					</span>
					<img src="/brand/text.svg" alt="Brand Text" height="40">
				</a>
			</h1>
		</header> -->
		<article>
			<header>
				<Search />
			</header>

			<Chain />
		</article>
	</section>
</template>

<script>
import Chain from '@/components/home/Chain.vue';
import Search from '@/components/home/Search.vue';

export default {
	components: { Search, Chain },
	data()
	{
		return { active: true };
	},
	mounted()
	{
		window.addEventListener('scroll', this.scroll)
	},
	methods:
	{
		scroll()
		{
			this.active = window.scrollY <= 60;
		}
	}
}
</script>
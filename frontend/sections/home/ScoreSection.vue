
<template>
	<section class="section scores">
		<header></header>
		<article class="blurred" variant="i-primary">
			<header class="row">
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
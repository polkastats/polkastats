<template>
	<footer class="frame section text-center text-i-fifth" color="i-fourth">
		<article class="footer-menu p-3">
			<header class="m-3">
				<h2 social class="m-2">
					<a class="h2 mx-1" v-b-tooltip.hover href="https://github.com/Colm3na/polkastats-ng" target="_blank" :title="$t('layout.default.view_source_code_on_github')">
						<font-awesome-icon :icon="['fab', 'github']" />
					</a>
				</h2>
				<h1 brand class="display-1">
					<img src="/brand/logo.svg" alt="Brand Logo" height="40" logo>
					<img src="/brand/text.svg" alt="Brand Text" height="40" text>
				</h1>
			</header>
			
			<b-navbar class="my-4" aria-labelledby="Secondary Menu" link="i-fifth" link-hover="i-primary">
				<b-navbar-nav class="row m-auto">
					<b-nav-item v-for="item of menu" :key="item.name" :to="item.link">{{ item.name }}</b-nav-item>
					<b-nav-item v-for="item of legend" :key="item.name" :href="item.link" target="_blank">{{ item.name }}</b-nav-item>
				</b-navbar-nav>
			</b-navbar>
		</article>
		<address class="row flex-md-column flex-sm-row m-0 text-left float-right">
			<p variant="i-fourthB" class="address-item row flex-column m-0 p-4">
				<a v-for="info of address" :key="info.name" class="p-0 py-2" :href="info.link" target="_blank">
					<font-awesome-icon :icon="info.icon" class="d-block mb-1" />
					{{ info.name }}
				</a>
			</p>
			<p variant="i-primary" class="address-item row m-0 p-4 align-items-center justify-content-center" style="flex: 1">
				<img icon="grant" src="/brand/grant_badge.png" alt="Built with" height="64" />
			</p>
		</address>
	</footer>
</template>


<script>
export default {
	data()
	{
		const THAT = this;

		const menu =
		[
			{ get name(){ return THAT.$t('layout.default.about_us') }, link: '/team' },
			{ get name(){ return THAT.$t('layout.default.support_polkastats') }, link: '/support-us' },
			{ get name(){ return THAT.$t('layout.default.made_by') }, link: '/team' },
		]

		const legend =
		[
			{ get name(){ return THAT.$t('layout.default.built_with') + ' Basic Atttention Token' }, link: 'https://basicattentiontoken.org/', icon: 'built' },
		]

		const address =
		[
			{ name: '@PolkaStats', icon: ['fab', 'twitter'], link: 'https://twitter.com/polkastats' },
			{ name: 'PGP: 14C5 91D0 8ABA 03B7', icon: 'key', link: 'mailto:polkastats@protonmail.com' },
			{ name: 'polkastats@protonmail.com', icon: 'envelope', link: 'https://keybase.io/encrypt#polkastats' },
		]

		return { menu: menu, legend: legend, address: address };
	}
}
</script>
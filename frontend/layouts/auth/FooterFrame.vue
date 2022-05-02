<template>
	<footer class="frame section" color="i-fourth">
		<article>
			<header class="m-3">
				<h2 social>
					<nuxt-link class="h2" v-b-tooltip.hover to="https://github.com/Colm3na/polkastats-ng" title="View source code">
						<font-awesome-icon :icon="['fab', 'github']" />
					</nuxt-link>
				</h2>
				<h1 brand>
					<img src="/brand/logo.svg" alt="Brand Logo" height="40" logo>
					<img src="/brand/text.svg" alt="Brand Text" height="40" text>
				</h1>
			</header>
			
			<b-navbar aria-labelledby="Secondary Menu" link="i-fifth" link-hover="i-primary">
				<b-navbar-nav>
					<b-nav-item v-for="item of menu" :key="item.name" :href="item.link">{{ item.name }}</b-nav-item>
					<b-nav-item v-for="item of legend" :key="item.name" :href="item.link">{{ item.name }}</b-nav-item>
				</b-navbar-nav>
			</b-navbar>
		</article>
		<address>
			<p variant="i-fourth" class="row m-0 p-4">
				<!-- <span v-for="info of address" :key="info.name" class="col-12 p-0 py-2"> -->
				<!-- <span v-for="info of address" :key="info.name" class="row p-0 py-2"> -->
				<!-- <span v-for="info of address" :key="info.name" class="col-12 p-0 py-2"> -->
				<span v-for="info of address" :key="info.name" class="p-0 py-2">
					<font-awesome-icon :icon="info.icon" />
					{{ info.name }}
				</span>
			</p>
			<p variant="i-primary" class="row m-0 p-4 align-items-center justify-content-center" style="flex: 1">
				<!-- <img src="/brand/grant_badge.png" alt="Built with" height="64" class="col-sm-3 col-md-12 col-lg-12" /> -->
				<img src="/brand/grant_badge.png" alt="Built with" height="64" />
			</p>
		</address>
	</footer>
</template>


<script>
export default {
	data()
	{
		const lang = this.$t('layout.default');

		const menu =
		[
			{ name: lang.about_us, link: '/team' },
			{ name: lang.support_polkastats, link: '/support-us' },
		]

		const legend =
		[
			{ name: lang.made_by, link: '/team' },
			{ name: lang.built_with + ' Basic Atttention Token', link: 'https://basicattentiontoken.org/', icon: 'built' },
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
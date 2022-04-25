<template>
	<footer class="frame section">
		<article>
			<header>
				<h2 social>
					<a href="https://github.com/Colm3na/polkastats-ng" icon="github" tooltip="View source code"></a>
				</h2>
				<h1 brand>
						<img src="/brand/logo.svg" alt="Brand Logo" height="40" logo>
						<img src="/brand/text.svg" alt="Brand Text" height="40" text>
				</h1>
			</header>
			<nav aria-labelledby="Secondary Menu">
				<ul>
					<li v-for="item of menu" :key="item.name"><a :href="item.link">{{ item.name }}</a></li>
					<li v-for="item of legend" :key="item.name"><a :href="item.link">{{ item.name }}</a></li>
				</ul>
			</nav>
		</article>
		<!-- <article class="container">
			<div>
				<div>
					<h2>
						<a href="https://github.com/Colm3na/polkastats-ng" icon="github" tooltip="View source code"></a>
					</h2>
					<h1 brand>
							<img src="/brand/logo.svg" alt="Brand Logo" height="40" logo>
							<img src="/brand/text.svg" alt="Brand Text" height="40" text>
					</h1>
				</div>
			</div>
			<nav aria-labelledby="Secondary Menu">
				<ul>
					<li v-for="item of menu" :key="item.name"><a :href="item.link">{{ item.name }}</a></li>
					<li v-for="item of legend" :key="item.name"><a :href="item.link">{{ item.name }}</a></li>
				</ul>
			</nav>
		</article> -->
		<address>
			<p color="fourth">
				<span v-for="info of address" :key="info.name" :icon="info.icon">{{ info.name }}</span>
			</p>
			<p color="primary">
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
			// { name: lang.view_source_code_on_github, link: 'https://github.com/Colm3na/polkastats-ng', icon: 'github' },
		]

		const address =
		[
			{ name: '@PolkaStats', icon: 'name', link: 'https://twitter.com/polkastats' },
			{ name: 'PGP: 14C5 91D0 8ABA 03B7', icon: 'key', link: 'mailto:polkastats@protonmail.com' },
			{ name: 'polkastats@protonmail.com', icon: 'email', link: 'https://keybase.io/encrypt#polkastats' },
		]

		return { menu: menu, legend: legend, address: address };
	}
}
</script>
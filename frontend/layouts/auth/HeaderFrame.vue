<template>
	<header class="frame section container" :active="active" :menu="menu">
		<h2>
			<a href="#" @click="toggleMenu()" icon="menu"></a>
		</h2>
		<h1 brand>
			<a href="/">
				<img src="/brand/logo.svg" alt="Brand Logo" height="24" logo>
				<img src="/brand/text.svg" alt="Brand Text" height="24" text>
			</a>
		</h1>
		<strong v-if="config.coinGeckoDenom && USDConversion && USD24hChange">
			<a :href="`https://www.coingecko.com/en/coins/${config.coinGeckoDenom}`" icon="kusama" color="secondary">
				{{ config.tokenSymbol }} ${{ USDConversion }} ({{ USD24hChange }}%)
			</a>
		</strong>
		<nav aria-labelledby="Principal Menu">
			<ul>
				<li v-for="item of links" :key="item.name">
					<dropdown-menu v-if="item.options" :options="item.options" :value="{ name: item.name }" />
					<a v-else :href="item.link">{{ item.name }}</a>
				</li>
			</ul>
		</nav>
		<ul>
			<li>
				<a href="#" icon="github"></a>
			</li>
			<li>
				<a href="#" icon="github"></a>
			</li>
			<li>
				<dropdown-menu color="primary" :options="networks" />
			</li>
			<li>
				<dropdown-menu color="fourthB" :options="langs" :value="langs[1]" />
			</li>
		</ul>
	</header>
</template>

<script>
import DropdownMenu from '@/components/more/DropdownMenu.vue';
import { config } from '@/frontend.config.js';

export default {
	components: { DropdownMenu },
	computed: {
		USDConversion() {
		return parseFloat(this.$store.state.fiat.usd).toFixed(3)
		},
		USD24hChange() {
		return parseFloat(this.$store.state.fiat.usd_24h_change).toFixed(2)
		},
	},
	created() {
    // Refresh fiat conversion values every minute
		if (this.config.coinGeckoDenom) {
		this.$store.dispatch('fiat/update')
		setInterval(() => {
			this.$store.dispatch('fiat/update')
		}, 60000)
		}
	},
	data()
	{
		const lang = this.$t('layout.default');

		const links =
		[
			{
				name: lang.validator,
				link: '/polkastats-validator'
			},
			{
				name: lang.how_to_stake,
				link: '/how-to-stake'
			},
			{
				name: 'Staking',
				options: 
				[ 
					{ 
						name: lang.staking_dashboard, 
						link: '/staking-dashboard' 
					},
					{
						name: lang.validators, 
						link: '/validators' 
					}
				],
			},
			{
				name: 'Blockchain',
				options:
				[
					{
						id: lang.blocks,
						name: lang.blocks,
						link: '/blocks',
					},
					{
						name: lang.transfers,
						link: '/transfers',
					},
					{
						name: lang.extrinsics,
						link: '/extrinsics',
					},
					{
						name: lang.events,
						link: '/events',
					},
				],
			},
			{
				name: lang.accounts,
				link: '/accounts'
			}
		]

		const networks =
		[
			{
				name: 'Kusama',
				link: 'https://kusama.polkastats.io',
				icon: 'kusama',
			},
			{
				name: 'Polkadot',
				link: 'https://polkastats.io',
				icon: 'polkadot',
			},
		]

		const langs =
		[
			{ name: 'EN', link: '/' },
			{ name: 'ES', link: '/es' },
		]

		return { config, active: false, menu: false, langs: langs, links: links, networks: networks };
	},
	mounted()
	{
		window.addEventListener('scroll', this.scroll);
	},
	methods:
	{
		scroll()
		{
			this.active = window.scrollY > 60;
		},
		toggleMenu()
		{
			this.menu = !this.menu;
		}
	}
}
</script>
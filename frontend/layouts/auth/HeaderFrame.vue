<template>
	<header class="frame" :active="active" :menu="menu">

		<b-navbar toggleable="xl" :color="options.variant" :link="options.link" :link-hover="options.hover" fixed="top" class="section container">
			
			<b-navbar-nav class="navbar-visible">
				<b-navbar-toggle target="nav-collapse" :class="['text-' + options.link, 'bg-' + options.variant, 'mr-2']">
					<template #default="{ expanded }">
						<font-awesome-icon v-if="expanded" icon="times"></font-awesome-icon>
						<font-awesome-icon v-else icon="bars"></font-awesome-icon>
					</template>
				</b-navbar-toggle>

				<b-navbar-brand href="/" left brand>
					<img src="/brand/logo.svg" alt="Brand Logo" height="24" logo>
					<img src="/brand/text.svg" alt="Brand Text" height="24" text>
				</b-navbar-brand>
				<b-nav-item :href="`https://www.coingecko.com/en/coins/${config.coinGeckoDenom}`" :link-attrs="{ icon: 'kusama', color: 'secondary' }" class="ml-auto">
					{{ config.tokenSymbol }} ${{ USDConversion }} ({{ USD24hChange }}%)
				</b-nav-item>
			</b-navbar-nav>

		<b-collapse class="sub-section" id="nav-collapse" is-nav :color="options.variant">
			<b-navbar-nav>
				<template v-for="item of links">
					<dropdown-menu :variant="item.variant" :key="item.name" :link="true" v-if="item.options" :options="item.options" :value="{ name: item.name }" />
					<b-nav-item :key="item.name" v-else :href="item.link">{{ item.name }}</b-nav-item>
				</template>
			</b-navbar-nav>

			<b-navbar-nav class="ml-auto tools">

				<b-nav-text class="mx-1"><b-button size="sm">Connect</b-button></b-nav-text>
				<b-nav-text class="mx-1"><b-button size="sm">0 / 24 Selected</b-button></b-nav-text>
				<b-nav-text class="mx-1"><dropdown-menu variant="i-primary" :options="networks" /></b-nav-text>
				<b-nav-text class="mx-1"><dropdown-menu variant="i-fourthB" :options="langs" :value="langs[1]" /></b-nav-text>

			</b-navbar-nav>
		</b-collapse>
		</b-navbar>

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
	props: ['options'],
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
				variant: this.options.variant,
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
				variant: this.options.variant,
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
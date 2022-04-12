<template>
	<header class="layout" :active="active" :menu="menu">
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


<style lang="scss" scoped>

@use '/assets/scss/polkadot/variables/colors/colors.scss' as COLOR;
@use '/assets/scss/polkadot/variables/fonts/families.scss' as FONT;

header
{
	position: fixed;
	z-index: 10;
	top: 0;
	left: 0;
	display: flex;
	width: 100%;
	align-items: center;
	color: COLOR.$fifth;
	padding: 1.6em;
	transition: 0.2s ease-out;
	white-space: nowrap;
	gap: 2em;

	&[active]
	{
		padding: 1em 1.6em;
		background-color: COLOR.$fourth;
		transition: 0.2s ease-in;

		& > h1
		{
			opacity: 1;
			transition: none;
			transition: 0.2s ease-in;
		}
	}

	&[active],
	&[menu]
	{
		> strong::before
		{
			opacity: 0;
		}
	}

	a:hover
	{
		color: inherit;
	}

	> h2
	{
		display: none;
	}

	[brand]
	{
		font-size: 2em;
	}

	> strong
	{
		position: relative;
		font-family: FONT.$secondaryMono;
		font-weight: 400;

		&::before
		{
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background-color: COLOR.$fifth;
			opacity: 15%;
			filter: blur(0.5em) saturate(200%);
		}
	}

	> nav
	{
		flex: 1;

		> ul > li
		{
			opacity: 0.75;
			transition: 0.3s linear;

			&:hover
			{
				opacity: 1;
			}
		}
	}

	> ul
	{
		> li
		{
			margin: 0.4em;
		}
	}
}

</style>
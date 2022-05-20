<template>
	<header class="frame" :active="status || active">

		<b-navbar toggleable="xl" :color="variant" :link="link" :link-hover="hover" fixed="top" class="section container">
			
			<b-navbar-nav class="navbar-visible">
				<b-navbar-toggle target="nav-collapse" :class="['text-' + link, 'bg-' + variant, 'mr-2', 'align-self-stretch']">
					<template #default="{ expanded }">
						<font-awesome-icon v-if="expanded" icon="times"></font-awesome-icon>
						<font-awesome-icon v-else icon="bars"></font-awesome-icon>
					</template>
				</b-navbar-toggle>
				<b-navbar-brand>
					<brand-component size="1.5"></brand-component>
				</b-navbar-brand>
				<b-nav-item :href="`https://www.coingecko.com/en/coins/${config.coinGeckoDenom}`" target="_blank" :link-attrs="{ icon: 'kusama', color: 'secondary' }" class="crypto-price ml-auto text-nowrap">
					{{ config.tokenSymbol }} ${{ USDConversion }} ({{ USD24hChange }}%)
				</b-nav-item>
			</b-navbar-nav>

		<b-collapse class="bg-i-fourth" pos="left" unfill id="nav-collapse" is-nav :color="variant">
			<b-navbar-nav>
				<template v-for="item of links">
					<dropdown-menu :variant="item.variant" :key="item.name" :link="true" v-if="item.options" :options="item.options" :value="{ name: item.name }" />
					<b-nav-item :key="item.name" v-else :to="item.link">{{ item.name }}</b-nav-item>
				</template>
			</b-navbar-nav>

			<b-navbar-nav class="menu-tools ml-auto flex-wrap flex-row justify-content-center">

				<b-nav-text class="mx-1">
					<b-button variant="i-danger" size="sm" v-b-modal.wallet-modal>
						<template v-if="selectedAddress">
							<Identicon :address="selectedAddress" :size="15" />
							{{ shortAddress(selectedAddress) }}
						</template>
						<template v-else>{{ $t('components.header.connect') }}</template>
					</b-button>
				</b-nav-text>
				<b-nav-text class="mx-1">
					<SelectedValidators variant="i-primary" :value="{ get name(){ return selected() } }" />
				</b-nav-text>
				<b-nav-text class="mx-1"><dropdown-menu variant="i-primary" :options="networks" /></b-nav-text>
				<b-nav-text class="mx-1">
					<Languages variant="i-fourthB" />
				</b-nav-text>

			</b-navbar-nav>
			
		</b-collapse>
		</b-navbar>

		<b-modal id="wallet-modal" size="lg" hide-header hide-footer>
			<template #default="{ hide }">
			<WalletSelector @close="hide()" />
			<p class="text-right mb-0">
				<b-button class="btn-sm" @click="hide()">Close</b-button>
			</p>
			</template>
		</b-modal>

	</header>
</template>

<script>
import DropdownMenu from '@/components/more/DropdownMenu.vue';
import { config } from '@/frontend.config.js';
import SelectedValidators from '@/components/staking/SelectedValidators.vue'
import Languages from '@/components/Languages.vue'
import WalletSelector from '@/components/WalletSelector.vue'
import Identicon from '@/components/Identicon.vue'
import BrandComponent from '@/components/more/BrandComponent.vue'

export default {
	components: { DropdownMenu, SelectedValidators, Identicon, Languages, WalletSelector, BrandComponent },
	computed: {
		loading() {
			return this.$store.state.ranking.loading
		},
		USDConversion() {
			return parseFloat(this.$store.state.fiat.usd).toFixed(3)
		},
		USD24hChange() {
			return parseFloat(this.$store.state.fiat.usd_24h_change).toFixed(2)
		},
		selectedValidatorAddresses() {
			return this.$store.state.ranking.selectedAddresses
		},
		selectedAddress() {
			return this.$store.state.ranking.selectedAddress
		},
		links()
		{
			return [
				{
					name: this.$t('layout.default.accounts'),
					link: this.localePath('/accounts')
				},
				{
					name: this.$t('layout.default.transfers'),
					link: this.localePath('/transfers')
				},
				{
					name: 'Staking',
					variant: this.variant,
					options: 
					[ 
						{ 
							name: this.$t('layout.default.staking_dashboard'), 
							link: this.localePath('/staking/dashboard') 
						},
						{
							name: this.$t('layout.default.validators'), 
							link: this.localePath('/staking/validators')
						},
						{
							name: this.$t('layout.default.validator'), 
							link: this.localePath('/staking/polkastats-validator')
						},
						{
							name: this.$t('layout.default.how_to_stake'),
							link: this.localePath('/staking/how-to-stake')
						}
					],
				},
				{
					name: 'Blockchain',
					variant: this.variant,
					options:
					[
						{
							name: this.$t('layout.default.blocks'),
							link: this.localePath('/blocks'),
						},
						{
							name: this.$t('layout.default.extrinsics'),
							link: this.localePath('/extrinsics'),
						},
						{
							name: this.$t('layout.default.events'),
							link: this.localePath('/events'),
						},
					],
				},
			]
		}
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
	props:
	{
		status: { type: Boolean },
		variant: { type: String, default: 'i-fourth' },
		link: { type: String, default: 'i-fifth' },
		hover: { type: String, default: 'i-fifth' },
	},
	data()
	{
		const networks =
		[
			{
				name: 'Kusama',
				href: 'https://kusama.polkastats.io',
				icon: 'kusama',
			},
			{
				name: 'Polkadot',
				href: 'https://polkastats.io',
				icon: 'polkadot',
			},
		]

		return { config, active: false, networks: networks };
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
		selected()
		{
			let selected = this.$t('components.header.selected');

			if(!this.loading)
				selected = this.selectedValidatorAddresses.length + '/' + this.config.validatorSetSize + ' ' + selected;

			return selected;
		}
	}
}
</script>
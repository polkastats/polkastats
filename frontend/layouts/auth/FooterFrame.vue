<template>
	<footer class="frame section text-center text-i-fifth" color="i-fourth">
		<article class="footer-menu p-3">
			<header class="m-3">
				<h2 social class="m-2">
					<a class="h2 mx-1" v-b-tooltip.hover href="https://github.com/Colm3na/polkastats-ng" target="_blank" :title="$t('layout.default.view_source_code_on_github')">
						<font-awesome-icon :icon="['fab', 'github']" />
					</a>
				</h2>
				<h1>
					<brand-component size="1.6"></brand-component>
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
			<p variant="i-primary" class="address-item row m-0 p-4 align-items-center justify-content-center flex-grow-1">
				<a href="https://web3.foundation/grants/" target="_blank">
					<img icon="grant" src="/brand/grant_badge.png" alt="Built with" height="64" />
				</a>
			</p>
		</address>
	</footer>
</template>


<script>
import BrandComponent from '@/components/more/BrandComponent.vue'

export default {
	components: { BrandComponent },
	computed:
	{
		menu()
		{
			return [
				{ name: this.$t('layout.default.about_us'), link: this.localePath('/team') },
				{ name: this.$t('layout.default.support_polkastats'), link: this.localePath('/support-us') },
				{ name: this.$t('layout.default.made_by'), link: this.localePath('/team') },
			]
		},
		legend()
		{
			return [
				{ name: this.$t('layout.default.built_with') + ' Basic Atttention Token', link: 'https://basicattentiontoken.org/', icon: 'built' },
			]
		}
	},
	data()
	{
		const address =
		[
			{ name: '@PolkaStats', icon: ['fab', 'twitter'], link: 'https://twitter.com/polkastats' },
			{ name: 'PGP: 14C5 91D0 8ABA 03B7', icon: 'key', link: 'mailto:polkastats@protonmail.com' },
			{ name: 'polkastats@protonmail.com', icon: 'envelope', link: 'https://keybase.io/encrypt#polkastats' },
		]

		return { address: address };
	}
}
</script>
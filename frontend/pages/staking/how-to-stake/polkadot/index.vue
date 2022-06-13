<template>

	<main>

		<header-component :ads="false">
			<search-section>
				
				<template #header>
					<h2 class="h6">
						<span icon-network="polkadot" class="ml-n2"> Polkadot</span>
					</h2>
					<h1>{{ $t('pages.how_to_stake.title', { networkName: config.name, }) }}</h1>
        			<b-breadcrumb class="section-staking justify-content-center bg-transparent" variant="i-fifth" :items="breadcrumbsItems"></b-breadcrumb>
				</template>

				<div class="section-staking row justify-content-center">

					<nuxt-link class="col-lg-6" :to="localePath('/staking/how-to-stake/polkadot/using-polkadotjs')">
						<article class="stake-item my-2 py-4 px-3" variant="i-fourth" background style="background-image: url(/img/PoslkadotJS.png)">
							<h1 class="h6 position-relative text-i-fsourth">
								<img class="mr-1 align-top" src="/img/PolkadotJS.png" alt="" style="height: 1em; border-radius: 50%;">
								{{ $t('pages.how_to_stake.polkadot.polkadotjs.title') }}</h1>
						</article>
					</nuxt-link>

				</div>

			</search-section>
		</header-component>

	</main>

  <!-- <div>
    <section>
      <b-container class="main py-5 how_to_stake-polkadot">
        <h1 class="mb-4">
          {{
            $t('pages.how_to_stake.polkadot.title', {
              networkName: config.name,
            })
          }}
        </h1>
        <b-breadcrumb :items="breadcrumbsItems"></b-breadcrumb>
        <div class="row">
          <div class="col-md-4 mb-4">
            <b-card class="text-center">
              <nuxt-link
                :to="
                  localePath('/staking/how-to-stake/polkadot/using-polkadotjs')
                "
                active-class="nuxt-link-exact-active"
                class="nav-link"
              >
                <img
                  class="wallet-logo img-fluid mb-2"
                  src="/img/PolkadotJS.png"
                />
                <h4 class="pt-4">
                  {{ $t('pages.how_to_stake.polkadot.polkadotjs.title') }}
                </h4>
              </nuxt-link>
            </b-card>
          </div>
        </div>
      </b-container>
    </section>
  </div> -->
</template>
<script>
import commonMixin from '~/mixins/commonMixin.js'
import { config } from '~/frontend.config.js'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'

export default {
	layout: 'AuthLayout',
	components: { HeaderComponent, SearchSection },
  mixins: [commonMixin],
  data() {
    return {
      config,
      breadcrumbsItems: [
        {
          text: this.$t('pages.home.title'),
          href: this.localePath('/'),
        },
        {
          text: this.$t('pages.how_to_stake.title', {
            networkName: config.name,
          }),
          href: this.localePath('/staking/how-to-stake'),
        },
        {
          text: this.$t('pages.how_to_stake.polkadot.title', {
            networkName: config.name,
          }),
          href: '#',
        },
      ],
    }
  },
  head() {
    return {
      title: this.$t('pages.how_to_stake.polkadot.head_title'),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.how_to_stake.polkadot.head_content'),
        },
      ],
    }
  },
}
</script>
<style>
.how_to_stake-polkadot .card {
  min-height: 250px;
}
.how_to_stake-polkadot .wallet-logo {
  max-height: 80px;
  height: 100%;
}
</style>

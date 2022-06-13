<template>

	<main>

		<header-component :ads="false">
			<search-section :title="$t('pages.how_to_stake.title', { networkName: config.name, })">

					<div class="section-staking row py-4">
						<nuxt-link class="col-lg-6" :to="localePath('/staking/how-to-stake/kusama')">
							<article class="stake-item my-2 py-5 px-3" variant="i-fourth" background="kusama">
								<b-badge icon-network="kusama" variant="i-primary" class="d-block"></b-badge>
								<h1 class="position-relative">Kusama</h1>
							</article>
						</nuxt-link>
						<nuxt-link class="col-lg-6" :to="localePath('/staking/how-to-stake/polkadot')">
							<article class="stake-item my-2 py-5 px-3" variant="i-fourth" background="polkadot">
								<b-badge icon-network="polkadot" variant="i-primary" class="d-block"></b-badge>
								<h1 class="position-relative">Polkadot</h1>
							</article>
						</nuxt-link>
					</div>

			</search-section>
		</header-component>

	</main>

  <!-- <div>
    <section>
      <b-container class="main py-5 support-us">
        <h1 class="mb-4">
          {{
            $t('pages.how_to_stake.title', {
              networkName: config.name,
            })
          }}
        </h1>
        <b-breadcrumb :items="breadcrumbsItems"></b-breadcrumb>
        <div class="row">
          <div class="col-md-4 mb-4">
            <b-card class="text-center" img-src="/img/Polkadot_bg.png" img-top>
              <nuxt-link
                :to="localePath('/staking/how-to-stake/polkadot')"
                active-class="nuxt-link-exact-active"
                class="nav-link"
              >
                <h4 class="pt-4">
                  {{ $t('pages.how_to_stake.polkadot.title') }}
                </h4>
              </nuxt-link>
            </b-card>
          </div>
          <div class="col-md-4 mb-4">
            <b-card class="text-center" img-src="/img/Kusama_bg.png" img-top>
              <nuxt-link
                :to="localePath('/staking/how-to-stake/kusama')"
                active-class="nuxt-link-exact-active"
                class="nav-link"
              >
                <h4 class="pt-4">
                  {{ $t('pages.how_to_stake.kusama.title') }}
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
          href: '#',
        },
      ],
    }
  },
  head() {
    return {
      title: this.$t('pages.how_to_stake.head_title'),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.how_to_stake.head_content'),
        },
      ],
    }
  },
}
</script>

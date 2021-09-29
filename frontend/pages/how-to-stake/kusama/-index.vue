<template>
  <div>
    <section>
      <b-container class="main py-5 how_to_stake-kusama">
        <h1 class="mb-4">
          {{
            $t('pages.how_to_stake.kusama.title', {
              networkName: network.name,
            })
          }}
        </h1>
        <b-breadcrumb :items="breadcrumbsItems"></b-breadcrumb>
        <div class="row">
          <!-- <div class="col-md-4 mb-4">
            <b-card class="text-center">
              <nuxt-link
                to="/how-to-stake/kusama/using-polkastats"
                active-class="nuxt-link-exact-active"
                class="nav-link"
              >
                <img
                  class="wallet-logo img-fluid mb-2"
                  src="/img/Avatar_Light@2x.png"
                />
                <h4 class="pt-4">
                  {{ $t('pages.how_to_stake.kusama.polkastats.title') }}
                </h4>
              </nuxt-link>
            </b-card>
          </div>
          <div class="col-md-4 mb-4">
            <b-card class="text-center">
              <nuxt-link
                to="/how-to-stake/kusama/using-lunie"
                active-class="nuxt-link-exact-active"
                class="nav-link"
              >
                <img
                  class="wallet-logo img-fluid mb-2 pt-2 pb-2"
                  src="/img/lunie.svg"
                />
                <h4 class="pt-4">
                  {{ $t('pages.how_to_stake.kusama.lunie.title') }}
                </h4>
              </nuxt-link>
            </b-card>
          </div> -->
          <div class="col-md-4 mb-4">
            <b-card class="text-center">
              <nuxt-link
                to="/how-to-stake/kusama/using-polkadotjs"
                active-class="nuxt-link-exact-active"
                class="nav-link"
              >
                <img
                  class="wallet-logo img-fluid mb-2"
                  src="/img/PolkadotJS.png"
                />
                <h4 class="pt-4">
                  {{ $t('pages.how_to_stake.kusama.polkadotjs.title') }}
                </h4>
              </nuxt-link>
            </b-card>
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>
<script>
import commonMixin from '~/mixins/commonMixin.js'
import { network } from '~/frontend.config.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      network,
      breadcrumbsItems: [
        {
          text: this.$t('pages.home.title'),
          href: '/',
        },
        {
          text: this.$t('pages.how_to_stake.title', {
            networkName: network.name,
          }),
          href: '/how-to-stake',
        },
        {
          text: this.$t('pages.how_to_stake.kusama.title', {
            networkName: network.name,
          }),
          href: '#',
        },
      ],
    }
  },
  head() {
    return {
      title: this.$t('pages.how_to_stake.kusama.head_title'),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.how_to_stake.kusama.head_content'),
        },
      ],
    }
  },
}
</script>
<style>
.how_to_stake-kusama .card {
  min-height: 250px;
}
.how_to_stake-kusama .wallet-logo {
  max-height: 80px;
  height: 100%;
}
</style>

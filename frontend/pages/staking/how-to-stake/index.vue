<template>
  <div>
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
                to="/staking/how-to-stake/polkadot"
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
                to="/staking/how-to-stake/kusama"
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
  </div>
</template>
<script>
import commonMixin from '~/mixins/commonMixin.js'
import { config } from '~/frontend.config.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
      breadcrumbsItems: [
        {
          text: this.$t('pages.home.title'),
          href: '/',
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

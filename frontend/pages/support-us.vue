<template>

	<main>
		<header-component>
			<search-section :title="$t('pages.support-us.support_polkastats')">

				<b-col md="6" class="mx-auto mt-4">
					{{ $t('pages.support-us.polkastats_software_TEXT') }}
					{{ $t('pages.support-us.i_enjoy_developing_TEXT') }}
					{{ $t('pages.support-us.if_you_like_TEXT') }}
				</b-col>

			</search-section>
		</header-component>

		<section class="section section-support" color="i-third-2">

			<b-row class="align-items-center py-4">
				<b-col sm="3" lg="2">
					<h1 class="text-lg">
						<font-awesome-icon class="h3 align-middle mr-2" :icon="['fab', 'github-alt']" />
						{{ $t('pages.support-us.feedback') }}
					</h1>
				</b-col>
				<b-col sm="7" lg="8" class="mb-2 mb-sm-0">
					<p>
						{{ $t('pages.support-us.we_love_feedback_TEXT') }}
						<a href="https://github.com/Colm3na/polkastats-v3" target="_blank">{{ $t('pages.support-us.github_repository') }}</a>
					</p>
				</b-col>
				<b-col sm="2" class="text-sm-right">
					<b-button class="text-i-fifth" target="_blank" href="https://github.com/Colm3na/polkastats-v3" variant="i-primary" size="sm">GitHub</b-button>
				</b-col>
			</b-row>

			<b-row class="align-items-center py-4">
				<b-col md="10" sm="9" class="mb-2 mb-sm-0 ">
					<h1 class="mb-2 text-lg">{{ $t('pages.support-us.stake_in_our_validator') }}</h1>
					<p>{{ $t('pages.support-us.this_is_an_TEXT') }}</p>
				</b-col>
				<b-col md="2" sm="3" class="text-sm-right">
					<b-button class="text-i-fifth text-nowrap" :to="localePath('/staking/how-to-stake')" variant="i-fourth" size="sm">{{ $t('layout.default.how_to_stake') }}</b-button>
				</b-col>
			</b-row>

			<b-row class="align-items-center py-4">
				<b-col sm="1">
					<font-awesome-icon class="h3" :icon="['fab', 'twitter']" />
				</b-col>
				<b-col sm="9" class="mb-2 mb-sm-0 ">
					<h1 class="mb-2 text-lg">{{ $t('pages.support-us.follow_polkastats_on_twitter') }}</h1>
					<p>
						{{ $t('pages.support-us.are_you_a_TEXT') }}
						<a target="_blank" href="https://twitter.com/polkastats">@PolkaStats</a>
						{{ $t('pages.support-us.on_twitter_to_get_TEXT') }}.
					</p>
				</b-col>
				<b-col sm="2" class="text-sm-right">
					<b-button class="text-i-fifth" target="_blank" href="https://twitter.com/polkastats" variant="i-primary" size="sm">Twitter</b-button>
				</b-col>
			</b-row>

		</section>



	</main>


  <!-- <div>
    <section>
      <b-container class="main py-5 support-us">
        <h1 class="mb-4">
          {{ $t('pages.support-us.support_polkastats') }}
        </h1>

        <p>
          {{ $t('pages.support-us.polkastats_software_TEXT') }}
        </p>

        <p>
          {{ $t('pages.support-us.i_enjoy_developing_TEXT') }}
        </p>

        <p>
          {{ $t('pages.support-us.if_you_like_TEXT') }}
        </p>

        <h4 class="mt-5 mb-4">
          {{ $t('pages.support-us.feedback') }}
        </h4>

        <p>
          {{ $t('pages.support-us.we_love_feedback_TEXT') }}
          <a href="https://github.com/Colm3na/polkastats-v3" target="_blank">{{
            $t('pages.support-us.github_repository')
          }}</a
          >.
        </p>

        <h4 class="mt-5 mb-4">
          {{ $t('pages.support-us.stake_in_our_validator') }}
        </h4>

        <p>
          {{ $t('pages.support-us.this_is_an_TEXT') }}
        </p>

        <h4 class="mt-5 mb-4">
          {{ $t('pages.support-us.follow_polkastats_on_twitter') }}
        </h4>
        <p>
          {{ $t('pages.support-us.are_you_a_TEXT') }}
          <a target="_blank" href="https://twitter.com/polkastats"
            ><i class="fab fa-twitter" /> @PolkaStats</a
          >
          {{ $t('pages.support-us.on_twitter_to_get_TEXT') }}.
        </p>
      </b-container>
    </section>
  </div> -->
</template>
<script>
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'

export default {
	layout: 'AuthLayout',
	components: {
		HeaderComponent,
		SearchSection
	},
  head() {
    return {
      title: this.$t('pages.support-us.head_title'),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.support-us.head_content'),
        },
      ],
    }
  },
}
</script>

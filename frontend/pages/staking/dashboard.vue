<template>
	<main>
		<header-component>
			<search-section
				:title="$t('pages.dashboard.title')" 
			>
				<StakingStats class="mt-2" />
      			<Suggestions :validators="chainValidatorAddresses" />
			</search-section>
		</header-component>
		<section class="section text-center">
			<b-row class="mb-4">
				<b-col lg="6">
					<header type="block" variant="i-fourth" class="mb-4">
						<h1 class="h5">{{ $t('components.dashboard_commission.title') }}</h1>
					</header>
					<DashboardCommission style="height: 250px;" />
				</b-col>
				<b-col lg="6">
					<header type="block" variant="i-fourth" class="mb-4">
						<h1 class="h5">{{ $t('components.dashboard_self_stake.title') }}</h1>
					</header>
					<DashboardSelfStake style="height: 250px;" />
				</b-col>
			</b-row>
			<b-row>
				<b-col lg="6">
					<header type="block" variant="i-fourth" class="mb-4">
						<h1 class="h5">{{ $t('components.dashboard_performance.title') }}</h1>
					</header>
					<DashboardPerformance style="height: 250px;" />
				</b-col>
				<b-col lg="6">
					<header type="block" variant="i-fourth" class="mb-4">
						<h1 class="h5">{{ $t('components.dashboard_era_points.title') }}</h1>
					</header>
					<DashboardEraPoints style="height: 250px;" />
				</b-col>
			</b-row>
		</section>
	</main>


  <!-- <div class="page container pt-3">
    <div>
      <StakingStats />
      <Suggestions :validators="chainValidatorAddresses" />
      <div class="row">
        <div class="col-lg-6">
          <DashboardCommission style="height: 300px;" />
        </div>
        <div class="col-lg-6">
          <DashboardSelfStake style="height: 300px;" />
        </div>
      </div>
      <div class="row">
        <div class="col-lg-6">
          <DashboardPerformance style="height: 300px;" />
        </div>
        <div class="col-lg-6">
          <DashboardEraPoints style="height: 300px;" />
        </div>
      </div>
    </div>
  </div> -->
</template>

<script>
import { config } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'
import StakingStats from '@/components/staking/dashboard/StakingStats.vue'
import Suggestions from '@/components/staking/dashboard/Suggestions.vue'
import DashboardCommission from '@/components/staking/dashboard/charts/DashboardCommission.vue'
import DashboardSelfStake from '@/components/staking/dashboard/charts/DashboardSelfStake.vue'
import DashboardPerformance from '@/components/staking/dashboard/charts/DashboardPerformance.vue'
import DashboardEraPoints from '@/components/staking/dashboard/charts/DashboardEraPoints.vue'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'

export default {
  	layout: 'AuthLayout',
  components: {
    StakingStats,
    Suggestions,
    DashboardCommission,
    DashboardSelfStake,
    DashboardPerformance,
    DashboardEraPoints,
	HeaderComponent,
	SearchSection
  },
  mixins: [commonMixin],
  data() {
    return {
      config,
    }
  },
  head() {
    return {
      title: this.$t('pages.staking_dashboard.head_title', {
        networkName: config.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.staking_dashboard.head_content', {
            networkName: config.name,
          }),
        },
      ],
    }
  },
  computed: {
    eras() {
      return this.rows.map((row) => row.era)
    },
    selectedValidatorAddresses() {
      return this.$store.state.ranking.selectedAddresses
    },
    chainValidatorAddresses() {
      return this.$store.state.ranking.chainValidatorAddresses
    },
  },
}
</script>

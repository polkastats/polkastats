<template>
	<main class="layout">
		<score-section />
		<chart-section />
		<table-section />
	</main>
	
  <!-- <div>
		<section>
		<b-container class="main py-5 dashboard">
			<Search />
			<Chain />
			<TransfersChart />
			<TotalIssuanceChart />
			<div class="row">
			<div class="col-md-6 mb-4">
				<h3>
				<nuxt-link
					v-b-tooltip.hover
					:to="`/blocks`"
					title="Click to see last blocks"
				>
					Last blocks
				</nuxt-link>
				</h3>
				<LastBlocks />
			</div>
			<div class="col-md-6 mb-4">
				<h3>
				<nuxt-link
					v-b-tooltip.hover
					:to="`/transfers`"
					title="Click to see last transfers"
				>
					Last transfers
				</nuxt-link>
				</h3>
				<LastTransfers />
			</div>
			</div>
			<div class="row">
			<div class="col-md-6 mb-4">
				<h3>
				<nuxt-link
					v-b-tooltip.hover
					:to="`/extrinsics`"
					title="Click to see last extrinsics"
				>
					Last extrinsics
				</nuxt-link>
				</h3>
				<LastExtrinsics />
			</div>
			<div class="col-md-6 mb-4">
				<h3>
				<nuxt-link
					v-b-tooltip.hover
					:to="`/events`"
					title="Click to see last events"
				>
					Last events
				</nuxt-link>
				</h3>
				<LastEvents />
			</div>
			</div>
		</b-container>
		</section>
  </div> -->
</template>
<script>
// import LastBlocks from '@/components/LastBlocks.vue'
// import LastTransfers from '@/components/LastTransfers.vue'
// import LastExtrinsics from '@/components/LastExtrinsics.vue'
// import LastEvents from '@/components/LastEvents.vue'
// // import TotalIssuanceChart from '@/components/TotalIssuanceChart.vue'
// import TransfersChart from '@/components/TransfersChart.vue'
// import Chain from '@/components/Chain.vue'
// import Search from '@/components/Search.vue'
// import Top10Rich from '@/components/Top10Rich.vue'
import { config } from '@/frontend.config.js'

import ChartSection from '../sections/home/ChartSection.vue'
import ScoreSection from '../sections/home/ScoreSection.vue'
import TableSection from '../sections/home/TableSection.vue'

export default {
  components: {
    // LastBlocks,
    // LastTransfers,
    // LastExtrinsics,
    // LastEvents,
    // // TotalIssuanceChart,
    // TransfersChart,
    // Chain,
    // Search,
    // Top10Rich,
	ScoreSection, ChartSection, TableSection
  },
  	layout: 'AuthLayout',
  data: () => {
    return {
      config,
    }
  },
  head() {
    return {
      title: 'PolkaStats block explorer',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'PolkaStats block explorer',
        },
      ],
    }
  },
}
</script>

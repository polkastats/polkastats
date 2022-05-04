<template>
	<main>
		<header-component>
			<score-section />
		</header-component>
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
            <LastBlocks />
          </div>
          <div class="col-md-6 mb-4">
            <LastTransfers />
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-4">
            <LastExtrinsics />
          </div>
          <div class="col-md-6 mb-4">
            <LastEvents />
          </div>
        </div>
        <div class="row">
          <div class="col-md-12 mb-4">
            <WhaleAlert />
          </div>
        </div>
      </b-container>
    </section>
  </div> -->
</template>

<script>
// import LastBlocks from '@/components/home/LastBlocks.vue'
// import LastTransfers from '@/components/home/LastTransfers.vue'
// import LastExtrinsics from '@/components/home/LastExtrinsics.vue'
// import LastEvents from '@/components/home/LastEvents.vue'
// import TransfersChart from '@/components/home/TransfersChart.vue'
// import WhaleAlert from '@/components/home/WhaleAlert.vue'
// import Chain from '@/components/home/Chain.vue'
// import Search from '@/components/home/Search.vue'
import { config } from '@/frontend.config.js'

import ChartSection from '../sections/home/ChartSection.vue'
import ScoreSection from '../sections/home/ScoreSection.vue'
import TableSection from '../sections/home/TableSection.vue'
import HeaderComponent from '@/components/more/HeaderComponent.vue'

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
	// WhaleAlert, 
	ScoreSection, ChartSection, TableSection, HeaderComponent
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

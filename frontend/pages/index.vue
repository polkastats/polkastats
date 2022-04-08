<template>
  <div>
    <section>
      <b-container class="main py-5 dashboard">
        <Search />
        <Chain />
        <TransfersChart />
        <!-- <TotalIssuanceChart /> -->
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
      </b-container>
    </section>
  </div>
</template>
<script>
import LastBlocks from '@/components/LastBlocks.vue'
import LastTransfers from '@/components/LastTransfers.vue'
import LastExtrinsics from '@/components/LastExtrinsics.vue'
import LastEvents from '@/components/LastEvents.vue'
import TransfersChart from '@/components/TransfersChart.vue'
import Chain from '@/components/Chain.vue'
import Search from '@/components/Search.vue'
import { config } from '@/frontend.config.js'

export default {
  components: {
    LastBlocks,
    LastTransfers,
    LastExtrinsics,
    LastEvents,
    TransfersChart,
    Chain,
    Search,
  },
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

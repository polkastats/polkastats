<template>
  <div class="page container pt-3">
    <div>
      <Stats />
      <Suggestions :validators="chainValidatorAddresses" />
      <div class="row">
        <div class="col-md-6">
          <DashboardCommission />
        </div>
        <div class="col-md-6">
          <DashboardSelfStake />
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <DashboardPerformance />
        </div>
        <div class="col-md-6">
          <DashboardEraPoints />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { config } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'
import Stats from '@/components/dashboard/Stats.vue'
import Suggestions from '@/components/dashboard/Suggestions.vue'
import DashboardCommission from '@/components/dashboard/charts/DashboardCommission.vue'
import DashboardSelfStake from '@/components/dashboard/charts/DashboardSelfStake.vue'
import DashboardPerformance from '@/components/dashboard/charts/DashboardPerformance.vue'
import DashboardEraPoints from '@/components/dashboard/charts/DashboardEraPoints.vue'
export default {
  components: {
    Stats,
    Suggestions,
    DashboardCommission,
    DashboardSelfStake,
    DashboardPerformance,
    DashboardEraPoints,
  },
  mixins: [commonMixin],
  data() {
    return {
      config,
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

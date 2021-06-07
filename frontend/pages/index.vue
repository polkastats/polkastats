<template>
  <div class="page container-fluid pt-3">
    <div>
      <b-alert
        show
        dismissible
        variant="warning"
        class="text-center py-3 glitch"
      >
        <p>
          The {{ config.title }} for {{ capitalize(config.name) }} aims to
          provide quantitative and qualitative data about validators performance
          and help nominators to choose their best nomination set.
        </p>
        <p>
          The size of the
          <strong
            >history is {{ config.historySize }} eras ({{
              config.historySize / config.erasPerDay
            }}
            days)</strong
          >
        </p>
        <p>
          This platform is currently under development and the metrics are
          subject to change. Please do your own research before nominating your
          validator set.
        </p>
      </b-alert>

      <Stats />
      <Suggestions :validators="chainValidatorAddresses" />
      <DashboardVRCScore />
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
import { config } from '@/config.js'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
    }
  },
  head() {
    return {
      title: `${config.title} for ${this.capitalize(config.name)}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: `${config.title} for ${this.capitalize(config.name)}`,
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

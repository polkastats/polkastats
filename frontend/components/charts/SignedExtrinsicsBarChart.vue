<template>
  <div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else>
      <ChartFilter :buttons="filterButtons" :active-button="activeButton" />
      <BarChart
        class="canvas-chart"
        :chart-data="chartData"
        :options="chartOptions"
        :height="200"
      />
    </div>
  </div>
</template>
<script>
import BarChart from '@/components/charts/BarChart.js'
import Loading from '@/components/Loading.vue'
import ChartFilter from '@/components/ChartFilter.vue'
import chartsMixin from '@/mixins/chartsMixin.js'
import Constants from '@/constants/charts.js'

export default {
  components: {
    BarChart,
    Loading,
    ChartFilter,
  },
  mixins: [chartsMixin],
  data() {
    return {
      filterButtons: this.getDefaultFilterButtons(),
      loading: true,
      activeButton: Constants.oneMonth,
      chartData: {},
      chartOptions: this.getChartOptions(
        'Cere Signed Extrinsics Chart ',
        'Extrinsics per Period'
      ),
    }
  },
  mounted() {
    this.month()
  },
  methods: {
    async month() {
      this.activeButton = Constants.oneMonth
      const { count, label } = await this.signedExtrinsicDayCount(
        Constants.oneMonthQueryLimit
      )
      const chartData = this.getExtrinsicsChartData(label, count)
      this.chartData = chartData
      this.loading = false
    },
    async months() {
      this.activeButton = Constants.threeMonth
      const { count, label } = await this.signedExtrinsicDayCount(
        Constants.threeMonthQueryLimit
      )
      const chartData = this.getExtrinsicsChartData(label, count)
      this.chartData = chartData
      this.loading = false
    },
    async year() {
      this.activeButton = Constants.oneYear
      const { count, label } = await this.signedExtrinsicMonthCount(
        Constants.oneYearQueryLimit
      )
      const chartData = this.getExtrinsicsChartData(label, count)
      this.chartData = chartData
      this.loading = false
    },
    async max() {
      this.activeButton = Constants.max
      const { count, label } = await this.signedExtrinsicMonthCount(
        Constants.maxQueryLimit
      )
      const chartData = this.getExtrinsicsChartData(label, count)
      this.chartData = chartData
      this.loading = false
    },
  },
}
</script>

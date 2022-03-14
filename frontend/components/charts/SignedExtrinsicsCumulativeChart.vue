<template>
  <div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else>
      <ChartFilter :buttons="filterButtons" :active-button="activeButton" />
      <ReactiveLineChart
        class="canvas-chart"
        :chart-data="chartData"
        :options="chartOptions"
        :height="200"
      />
    </div>
  </div>
</template>
<script>
import ReactiveLineChart from '@/components/charts/ReactiveLineChart.js'
import Loading from '@/components/Loading.vue'
import ChartFilter from '@/components/ChartFilter.vue'
import chartsMixin from '@/mixins/chartsMixin'
import Constants from '@/constants/charts.js'

export default {
  components: {
    ReactiveLineChart,
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
        'Cere Signed Extrinsics Cumulative Chart',
        'Extrinsics by Period'
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
      const cumulativeCount = await this.cumulativeValue(count)
      const chartData = this.getExtrinsicsChartData(label, cumulativeCount)
      this.chartData = chartData
      this.loading = false
    },
    async months() {
      this.activeButton = Constants.threeMonth
      const { count, label } = await this.signedExtrinsicDayCount(
        Constants.threeMonthQueryLimit
      )
      const cumulativeCount = await this.cumulativeValue(count)
      const chartData = this.getExtrinsicsChartData(label, cumulativeCount)
      this.chartData = chartData
      this.loading = false
    },
    async year() {
      this.activeButton = Constants.oneYear
      const { count, label } = await this.signedExtrinsicMonthCount(
        Constants.oneYearQueryLimit
      )
      const cumulativeCount = await this.cumulativeValue(count)
      const chartData = this.getExtrinsicsChartData(label, cumulativeCount)
      this.chartData = chartData
      this.loading = false
    },
    async max() {
      this.activeButton = Constants.max
      const { count, label } = await this.signedExtrinsicMonthCount(
        Constants.maxQueryLimit
      )
      const cumulativeCount = await this.cumulativeValue(count)
      const chartData = this.getExtrinsicsChartData(label, cumulativeCount)
      this.chartData = chartData
      this.loading = false
    },
  },
}
</script>

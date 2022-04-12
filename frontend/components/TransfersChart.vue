<template>
  <div v-if="loading" class="text-center py-4">
    <Loading />
  </div>
  <div v-else>
    <ReactiveLineChart
      :chart-data="chartData"
      :options="chart.options"
    />
  </div>
</template>
<script>
import axios from 'axios'
import Loading from '@/components/Loading.vue'
import ReactiveLineChart from '@/components/charts/ReactiveLineChart.js'
import { config } from '@/frontend.config.js'
import { ChartLineOptions } from './charts/settings/chartline';

export default {
  components: {
    Loading,
    ReactiveLineChart,
  },
  props: {
    accountId: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
		chart: new ChartLineOptions('DATE', 'BALANCE TRANSFERS'),
      loading: true,
      apiData: [],
    }
  },
  computed: {
    chartData() {
		this.chart.setData(this.apiData.map(({ transfers }) => transfers));
		this.chart.setLabels(this.apiData.map(({ date }) => date));

	return this.chart.data;
    },
  },
  async created() {
    try {
      const response = await axios.get(
        `${config.backendAPI}/api/v1/charts/transfers`
      )
      this.apiData = response.data.data
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('Error fetching tx chart data: ', error)
    }
    this.loading = false
  },
}
</script>

<style lang="scss" scoped>

	div
	{
		max-height: 100%;
	}

</style>

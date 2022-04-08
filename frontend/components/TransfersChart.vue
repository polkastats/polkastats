<template>
  <div v-if="loading" class="text-center py-4">
    <Loading />
  </div>
  <div v-else>
    <ReactiveLineChart
      :chart-data="chartData"
      :options="chartOptions"
      :height="100"
      class="mb-4"
    />
  </div>
</template>
<script>
import axios from 'axios'
import Loading from '@/components/Loading.vue'
import ReactiveLineChart from '@/components/charts/ReactiveLineChart.js'
import { config } from '@/frontend.config.js'
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
      chartOptions: {
        responsive: true,
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: this.$t('components.transfers_chart.title'),
          fontSize: 18,
          fontColor: '#000',
          fontStyle: 'lighter',
        },
        tooltips: {
          backgroundColor: '#000000',
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: true,
                color: 'rgba(200, 200, 200, 0.4)',
              },
              scaleLabel: {
                display: true,
                labelString: this.$t('components.transfers_chart.date'),
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                suggestedMin: 0,
                // suggestedMax: 100,
              },
              gridLines: {
                display: true,
                color: 'rgba(200, 200, 200, 0.4)',
              },
              scaleLabel: {
                display: true,
                labelString: this.$t(
                  'components.transfers_chart.balance_transfers'
                ),
              },
            },
          ],
        },
      },
      loading: true,
      apiData: [],
    }
  },
  computed: {
    chartData() {
      return {
        labels: this.apiData.map(({ date }) => date),
        datasets: [
          {
            labels: 'total',
            data: this.apiData.map(({ transfers }) => transfers),
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(230, 0, 122, 0.8)',
            hoverBackgroundColor: 'rgba(255, 255, 255, 0.8)',
            fill: false,
            showLine: true,
          },
        ],
      }
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

<template>
  <LineChart :data="chartData" :options="chartOptions" :height="200" />
</template>
<script>
import { BigNumber } from 'bignumber.js'
import LineChart from '@/components/charts/LineChart.js'
import { config } from '@/frontend.config.js'
export default {
  components: {
    LineChart,
  },
  props: {
    stakeHistory: {
      type: Array,
      default: () => [],
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
          text: `elected self stake (${config.tokenSymbol})`,
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
                labelString: 'era',
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                suggestedMin: 0,
              },
              gridLines: {
                display: true,
                color: 'rgba(200, 200, 200, 0.4)',
              },
            },
          ],
        },
      },
    }
  },
  computed: {
    chartData() {
      return {
        labels: this.stakeHistory.map(({ era }) => era),
        datasets: [
          {
            labels: 'elected own stake',
            data: this.stakeHistory.map(({ self }) =>
              new BigNumber(self)
                .div(new BigNumber(10).pow(config.tokenDecimals))
                .toNumber()
            ),
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
}
</script>

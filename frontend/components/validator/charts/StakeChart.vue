<template>
  <line-chart
    :data="chartData"
    :options="chartOptions"
    :height="200"
    style="background-color: rgba(0, 0, 0, 1)"
  />
</template>
<script>
import { BigNumber } from 'bignumber.js'
import { config } from '@/config.js'
export default {
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
          text: 'elected self stake',
          fontSize: 18,
          fontColor: '#fff',
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
                color: 'rgba(255, 255, 255, 0.1)',
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
                color: 'rgba(255, 255, 255, 0.1)',
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
        labels: this.stakeHistory.map(({ era }) => `Era ${era}`),
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

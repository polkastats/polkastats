<template>
  <bar-chart
    :data="chartData"
    :options="chartOptions"
    :height="200"
    style="background-color: rgba(0, 0, 0, 1)"
  />
</template>
<script>
import { config } from '@/config.js'
export default {
  props: {
    payoutHistory: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      config,
      chartOptions: {
        responsive: true,
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'payouts',
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
                suggestedMax: 1,
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
        labels: this.payoutHistory.map(({ era }) => `Era ${era}`),
        datasets: [
          {
            labels: 'payments',
            data: this.payoutHistory.map(({ status }) => {
              if (status === 'paid') {
                return 1
              } else if (status === 'inactive') {
                return 0
              }
              return -1
            }),
            backgroundColor: 'rgba(230, 0, 122, 0.8)',
            borderColor: 'rgba(230, 0, 122, 0.8)',
            hoverBackgroundColor: 'rgba(255, 255, 255, 0.8)',
            fill: true,
            showLine: true,
          },
        ],
      }
    },
    pending() {
      return this.payoutHistory.filter((payout) => payout.status === 'pending')
        .length
    },
  },
}
</script>

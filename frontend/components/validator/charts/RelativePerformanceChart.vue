<template>
  <LineChart :data="chartData" :options="chartOptions" :height="200" />
</template>
<script>
import LineChart from '@/components/charts/LineChart.js'
export default {
  components: {
    LineChart,
  },
  props: {
    relativePerformanceHistory: {
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
          text: 'relative performance',
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
        labels: this.relativePerformanceHistory.map(({ era }) => `Era ${era}`),
        datasets: [
          {
            labels: 'relative performance',
            data: this.relativePerformanceHistory.map(
              ({ relativePerformance }) => relativePerformance
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

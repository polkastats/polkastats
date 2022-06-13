<template>
  <LineChart :data="chartData" :options="chart.options" :height="200" />
</template>
<script>
import LineChart from '@/components/charts/LineChart.js'
import { ChartLineOptions } from '@/components/charts/settings/chartline';

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
	  chart: new ChartLineOptions('era'),
    //   chartOptions: {
    //     responsive: true,
    //     legend: {
    //       display: false,
    //     },
    //     title: {
    //       display: true,
    //       text: this.$t('components.relative_performance_chart.title'),
    //       fontSize: 18,
    //       fontColor: '#000',
    //       fontStyle: 'lighter',
    //     },
    //     tooltips: {
    //       backgroundColor: '#000000',
    //     },
    //     scales: {
    //       xAxes: [
    //         {
    //           gridLines: {
    //             display: true,
    //             color: 'rgba(200, 200, 200, 0.4)',
    //           },
    //           scaleLabel: {
    //             display: true,
    //             labelString: 'era',
    //           },
    //         },
    //       ],
    //       yAxes: [
    //         {
    //           ticks: {
    //             beginAtZero: true,
    //             suggestedMin: 0,
    //           },
    //           gridLines: {
    //             display: true,
    //             color: 'rgba(200, 200, 200, 0.4)',
    //           },
    //         },
    //       ],
    //     },
    //   },
    }
  },
  computed: {
    chartData() {
		this.chart.setData(this.relativePerformanceHistory.map(({ relativePerformance }) => relativePerformance));
		this.chart.setLabels(this.relativePerformanceHistory.map(({ era }) => era));

		return this.chart.data;

    //   return {
    //     labels: this.relativePerformanceHistory.map(({ era }) => era),
    //     datasets: [
    //       {
    //         labels: this.$t(
    //           'components.relative_performance_chart.relative_performance'
    //         ),
    //         data: this.relativePerformanceHistory.map(
    //           ({ relativePerformance }) => relativePerformance
    //         ),
    //         backgroundColor: 'rgba(255, 255, 255, 0.8)',
    //         borderColor: 'rgba(230, 0, 122, 0.8)',
    //         hoverBackgroundColor: 'rgba(255, 255, 255, 0.8)',
    //         fill: false,
    //         showLine: true,
    //       },
    //     ],
    //   }
    },
  },
}
</script>

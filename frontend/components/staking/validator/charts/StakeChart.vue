<template>
  <LineChart :data="chartData" :options="chart.options" :height="200" />
</template>
<script>
import { BigNumber } from 'bignumber.js'
import LineChart from '@/components/charts/LineChart.js'
import { config } from '@/frontend.config.js'
import { ChartLineOptions } from '@/components/charts/settings/chartline';

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
	  chart: new ChartLineOptions('era'),
    //   chartOptions: {
    //     responsive: true,
    //     legend: {
    //       display: false,
    //     },
    //     title: {
    //       display: true,
    //       text: this.$t('components.stake_chart.title', {
    //         tokenSymbol: config.tokenSymbol,
    //       }),
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
		this.chart.setData(
			this.stakeHistory.map(({ self }) => new BigNumber(self)
			.div(new BigNumber(10).pow(config.tokenDecimals))
			.toNumber())
		);
		this.chart.setLabels(this.stakeHistory.map(({ era }) => era));

		return this.chart.data;
    //   return {
    //     labels: this.stakeHistory.map(({ era }) => era),
    //     datasets: [
    //       {
    //         labels: this.$t('components.stake_chart.elected_own_stake'),
    //         data: this.stakeHistory.map(({ self }) =>
    //           new BigNumber(self)
    //             .div(new BigNumber(10).pow(config.tokenDecimals))
    //             .toNumber()
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

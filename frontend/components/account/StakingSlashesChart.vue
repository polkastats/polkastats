<template>
  <ReactiveLineChart
    :chart-data="chartData"
    :options="chart.options"
  />
</template>
<script>
import { gql } from 'graphql-tag'
import { BigNumber } from 'bignumber.js'
import ReactiveLineChart from '@/components/charts/ReactiveLineChart.js'
import { config } from '@/frontend.config.js'
import { ChartLineOptions } from '@/components/charts/settings/chartline';

export default {
  components: {
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
	  chart: new ChartLineOptions('era', this.$t('components.staking_slashes_chart.slash')),
    //   chartOptions: {
    //     responsive: true,
    //     legend: {
    //       display: false,
    //     },
    //     title: {
    //       display: true,
    //       text: this.$t('components.staking_slashes_chart.title'),
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
    //           scaleLabel: {
    //             display: true,
    //             labelString: this.$t('components.staking_slashes_chart.slash'),
    //           },
    //         },
    //       ],
    //     },
    //   },
      slashes: [],
    }
  },
  computed: {
	  chartData() {
		this.chart.setData(
			this.slashes.map(({ amount }) => new BigNumber(amount)
			.div(new BigNumber(10).pow(config.tokenDecimals))
			.toNumber())
		);
		this.chart.setLabels(this.slashes.map(({ era }) => era));

	return this.chart.data;

    //   return {
    //     labels: this.slashes.map(({ era }) => era),
    //     datasets: [
    //       {
    //         labels: 'slashes', // TODO
    //         data: this.slashes.map(({ amount }) =>
    //           new BigNumber(amount)
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
  apollo: {
    $subscribe: {
      slashes: {
        query: gql`
          subscription staking_slash($accountId: String!) {
            staking_slash(
              order_by: { era: asc }
              where: { account_id: { _eq: $accountId } }
            ) {
              era
              amount
              timestamp
            }
          }
        `,
        variables() {
          return {
            accountId: this.accountId,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.slashes = data.staking_slash.map((slash) => {
            return {
              era: slash.era,
              timestamp: slash.timestamp,
              amount: slash.amount,
            }
          })
        },
      },
    },
  },
}
</script>

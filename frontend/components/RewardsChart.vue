<template>
  <ReactiveLineChart
    :chart-data="chartData"
    :options="chartOptions"
    :height="100"
    class="mb-4"
  />
</template>
<script>
import { gql } from 'graphql-tag'
import { BigNumber } from 'bignumber.js'
import ReactiveLineChart from '@/components/charts/ReactiveLineChart.js'
import { network } from '@/frontend.config.js'
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
      chartOptions: {
        responsive: true,
        legend: {
          display: false,
        },
        title: {
          display: false,
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
                // suggestedMax: 100,
              },
              gridLines: {
                display: true,
                color: 'rgba(200, 200, 200, 0.4)',
              },
              scaleLabel: {
                display: true,
                labelString: 'reward',
              },
            },
          ],
        },
      },
      rewards: [],
      slashes: [],
      sentTx: [],
      receivedTx: [],
    }
  },
  computed: {
    chartData() {
      return {
        labels: this.rewards.map(({ era }) => era),
        datasets: [
          {
            labels: 'rewards',
            data: this.rewards.map(({ amount }) =>
              new BigNumber(amount)
                .div(new BigNumber(10).pow(network.tokenDecimals))
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
  apollo: {
    $subscribe: {
      rewards: {
        query: gql`
          subscription staking_reward($accountId: String!) {
            staking_reward(
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
          this.rewards = data.staking_reward.map((reward) => {
            return {
              era: reward.era,
              timestamp: reward.timestamp,
              amount: reward.amount,
            }
          })
        },
      },
    },
  },
}
</script>

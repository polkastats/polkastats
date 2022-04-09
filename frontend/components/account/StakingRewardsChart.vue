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
import { config } from '@/frontend.config.js'

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
          display: true,
          text: this.$t('components.staking_rewards_chart.title'),
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
              scaleLabel: {
                display: true,
                labelString: 'reward',
              },
            },
          ],
        },
      },
      rewards: [],
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
  apollo: {
    $subscribe: {
      rewards: {
        query: gql`
          subscription staking_reward(
            $accountId: String!
            $timestamp: bigint!
          ) {
            staking_reward(
              order_by: { era: asc }
              where: {
                account_id: { _eq: $accountId }
                timestamp: { _gte: $timestamp }
              }
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
            timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // last week
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

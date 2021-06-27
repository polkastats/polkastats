<template>
  <!-- <LineChart :data="chartData" :options="chartOptions" :height="200" /> -->
  <div>{{ balanceChanges }}</div>
</template>
<script>
// import LineChart from '@/components/charts/LineChart.js'
import { gql } from 'graphql-tag'
export default {
  // components: {
  //   LineChart,
  // },
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
          text: 'balance changes',
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
                // suggestedMax: 100,
              },
              gridLines: {
                display: true,
                color: 'rgba(200, 200, 200, 0.4)',
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
    balanceChanges() {
      const balanceChanges = this.rewards
        .concat(this.slashes)
        .concat(this.sentTx)
        .concat(this.receivedTx)
      // eslint-disable-next-line no-console
      console.log(balanceChanges)
      return balanceChanges || []
    },
    chartData() {
      return {
        // eslint-disable-next-line camelcase
        labels: this.rewards.map(({ block_number }) => `Block ${block_number}`),
        datasets: [
          {
            labels: 'rewards',
            data: this.rewards.map(({ reward }) => reward),
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
          subscription event($accountId: String!) {
            event(
              order_by: { block_number: desc }
              where: {
                section: { _eq: "staking" }
                method: { _eq: "Reward" }
                data: { _like: $accountId }
              }
            ) {
              block_number
              data
              timestamp
            }
          }
        `,
        variables() {
          return {
            accountId: `%"${this.accountId}",%`,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.rewards = data.event.map((event) => {
            return {
              block_number: event.block_number,
              timestamp: event.timestamp,
              amount: JSON.parse(event.data)[1],
            }
          })
          // eslint-disable-next-line no-console
          // console.log('rewards:', this.rewards)
        },
      },
      slashes: {
        query: gql`
          subscription event($accountId: String!, $phase: String!) {
            event(
              order_by: { block_number: desc }
              where: {
                section: { _eq: "staking" }
                method: { _eq: "Slash" }
                phase: { _eq: $phase }
                data: { _like: $accountId }
              }
            ) {
              block_number
              data
              timestamp
            }
          }
        `,
        variables() {
          return {
            accountId: `%"${this.accountId}",%`,
            phase: `{"applyExtrinsic":0}`,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.slashes = data.event.map((event) => {
            return {
              block_number: event.block_number,
              timestamp: event.timestamp,
              amount: JSON.parse(event.data)[1],
            }
          })
          // eslint-disable-next-line no-console
          // console.log('slashes:', this.slashes)
        },
      },
      sentTx: {
        query: gql`
          subscription extrinsic($signer: String!) {
            extrinsic(
              order_by: { block_number: desc }
              where: {
                section: { _eq: "balances" }
                method: { _like: "transfer%" }
                signer: { _eq: $signer }
                success: { _eq: true }
              }
            ) {
              block_number
              args
              timestamp
            }
          }
        `,
        variables() {
          return {
            signer: this.accountId,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.sentTx = data.extrinsic.map((transfer) => {
            return {
              block_number: transfer.block_number,
              timestamp: transfer.timestamp,
              amount: JSON.parse(transfer.args)[1],
            }
          })
          // eslint-disable-next-line no-console
          // console.log('sentTx:', this.sentTx)
        },
      },
      receivedTx: {
        query: gql`
          subscription event($accountId: String!) {
            event(
              order_by: { block_number: desc }
              where: {
                section: { _eq: "balances" }
                method: { _eq: "Transfer" }
                data: { _like: $accountId }
              }
            ) {
              block_number
              data
              timestamp
            }
          }
        `,
        variables() {
          return {
            accountId: `%,"${this.accountId}",%`,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.receivedTx = data.event.map((event) => {
            return {
              block_number: event.block_number,
              timestamp: event.timestamp,
              amount: JSON.parse(event.data)[2],
            }
          })
          // eslint-disable-next-line no-console
          // console.log('receivedTx:', this.sentTx)
        },
      },
    },
  },
}
</script>

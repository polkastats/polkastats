<template>
  <reactive-line-chart
    :chart-data="chartData"
    :options="chartOptions"
    class="py-4"
    style="height: 400px; background-color: rgba(0, 0, 0, 1)"
  />
</template>

<script>
import { BigNumber } from 'bignumber.js'
import gql from 'graphql-tag'
import { config } from '@/config.js'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: true,
        },
        title: {
          display: true,
          text: 'Average self stake',
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
                color: 'rgba(255, 255, 255, 0.1)',
              },
              scaleLabel: {
                display: true,
                labelString: 'avg. elected self stake',
              },
            },
          ],
        },
      },
      chartData: null,
      rows: [],
    }
  },
  computed: {
    eras() {
      return this.rows.map((row) => row.era)
    },
    selectedValidatorAddresses() {
      return this.$store.state.ranking.selectedAddresses
    },
    chainValidatorAddresses() {
      return this.$store.state.ranking.chainValidatorAddresses
    },
  },
  apollo: {
    $subscribe: {
      self_stake_avg: {
        query: gql`
          subscription era_self_stake_avg {
            era_self_stake_avg(order_by: { era: asc }) {
              era
              self_stake_avg
            }
          }
        `,
        result({ data }) {
          this.rows = data.era_self_stake_avg
          this.chartData = {
            labels: this.eras.map((era) => era),
            datasets: [
              {
                label: 'network',
                data: [
                  ...this.rows.map((row) =>
                    new BigNumber(row.self_stake_avg)
                      .div(new BigNumber(10).pow(config.tokenDecimals))
                      .toNumber()
                  ),
                ],
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: 'rgba(23, 162, 184, 0.8)',
                hoverBackgroundColor: 'rgba(255, 255, 255, 0.8)',
                fill: false,
                showLine: true,
              },
            ],
          }
        },
      },
      chain_self_stake_avg: {
        query: gql`
          subscription era_self_stake($validators: [String!]) {
            era_self_stake(
              order_by: { era: asc }
              where: { stash_address: { _in: $validators } }
            ) {
              era
              self_stake
            }
          }
        `,
        variables() {
          return {
            validators: this.chainValidatorAddresses,
          }
        },
        skip() {
          return !this.chartData
        },
        result({ data }) {
          const localChartData = {
            ...this.chartData,
          }
          if (data.era_self_stake.length > 0) {
            const items = this.eras.map((era) => {
              return (
                data.era_self_stake
                  .filter((row) => row.era === era)
                  .map((v) => parseFloat(v.self_stake))
                  .reduce((a, b) => a + b) /
                data.era_self_stake.filter((row) => row.era === era).length
              )
            })
            const dataset = {
              id: 'chain',
              label: 'on-chain validators',
              data: [
                ...items.map((row) =>
                  new BigNumber(row)
                    .div(new BigNumber(10).pow(config.tokenDecimals))
                    .toNumber()
                ),
              ],
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(184, 162, 23, 0.8)',
              hoverBackgroundColor: 'rgba(255, 255, 255, 0.8)',
              fill: false,
              showLine: true,
            }
            if (localChartData?.datasets) {
              if (localChartData.datasets.find(({ id }) => id === 'chain')) {
                const datasetIndex = localChartData.datasets.findIndex(
                  ({ id }) => id === 'chain'
                )
                localChartData.datasets[datasetIndex] = dataset
              } else {
                localChartData.datasets.push(dataset)
              }
            } else {
              localChartData.datasets.push(dataset)
            }
          } else if (localChartData?.datasets) {
            if (localChartData.datasets.find(({ id }) => id === 'chain')) {
              const datasetIndex = localChartData.datasets.findIndex(
                ({ id }) => id === 'chain'
              )
              localChartData.datasets.splice(datasetIndex, 1)
            }
          }
          this.chartData = localChartData
        },
      },
      selected_self_stake_avg: {
        query: gql`
          subscription era_self_stake($validators: [String!]) {
            era_self_stake(
              order_by: { era: asc }
              where: { stash_address: { _in: $validators } }
            ) {
              era
              self_stake
            }
          }
        `,
        variables() {
          return {
            validators: this.selectedValidatorAddresses,
          }
        },
        skip() {
          return !this.chartData
        },
        result({ data }) {
          const localChartData = {
            ...this.chartData,
          }
          if (data.era_self_stake.length > 0) {
            const items = this.eras.map((era) => {
              return (
                data.era_self_stake
                  .filter((row) => row.era === era)
                  .map((v) => parseFloat(v.self_stake))
                  .reduce((a, b) => a + b) /
                data.era_self_stake.filter((row) => row.era === era).length
              )
            })
            const dataset = {
              id: 'selected',
              label: 'selected validators',
              data: [
                ...items.map((row) =>
                  new BigNumber(row)
                    .div(new BigNumber(10).pow(config.tokenDecimals))
                    .toNumber()
                ),
              ],
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderColor: 'rgba(184, 23, 102, 0.8)',
              hoverBackgroundColor: 'rgba(255, 255, 255, 0.8)',
              fill: false,
              showLine: true,
            }
            if (localChartData?.datasets) {
              if (localChartData.datasets.find(({ id }) => id === 'selected')) {
                const datasetIndex = localChartData.datasets.findIndex(
                  ({ id }) => id === 'selected'
                )
                localChartData.datasets[datasetIndex] = dataset
              } else {
                localChartData.datasets.push(dataset)
              }
            } else {
              localChartData.datasets.push(dataset)
            }
          } else if (localChartData?.datasets) {
            if (localChartData.datasets.find(({ id }) => id === 'selected')) {
              const datasetIndex = localChartData.datasets.findIndex(
                ({ id }) => id === 'selected'
              )
              localChartData.datasets.splice(datasetIndex, 1)
            }
          }
          this.chartData = localChartData
        },
      },
    },
  },
}
</script>

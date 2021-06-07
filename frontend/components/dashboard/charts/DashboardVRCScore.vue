<template>
  <reactive-line-chart
    :chart-data="chartData"
    :options="chartOptions"
    class="py-4"
    style="height: 400px; background-color: rgba(0, 0, 0, 1)"
  />
</template>

<script>
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
          text: 'VRC score',
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
                labelString: 'avg. VRC score',
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
      return this.rows.length > 0
        ? this.rows
            .map(({ era }) => era)
            .filter((v, i, a) => a.indexOf(v) === i)
        : []
    },
    selectedValidatorAddresses() {
      return this.$store.state.ranking.selectedAddresses
    },
    chainValidatorAddresses() {
      return this.$store.state.ranking.chainValidatorAddresses
    },
    networkAvgData() {
      return this.eras.map(
        (era) =>
          this.rows
            .filter((row) => row.era === era)
            .map((v) => parseFloat(v.vrc_score))
            .reduce((a, b) => a + b) /
          this.rows.filter((row) => row.era === era).length
      )
    },
  },
  apollo: {
    $subscribe: {
      network_vrc_score: {
        query: gql`
          subscription era_vrc_score {
            era_vrc_score(order_by: { era: asc }) {
              era
              vrc_score
            }
          }
        `,
        result({ data }) {
          this.rows = data.era_vrc_score
          this.chartData = {
            labels: this.eras,
            datasets: [
              {
                label: 'network',
                data: this.networkAvgData,
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
      chain_vrc_score: {
        query: gql`
          subscription era_vrc_score($validators: [String!]) {
            era_vrc_score(
              order_by: { era: asc }
              where: { stash_address: { _in: $validators } }
            ) {
              era
              vrc_score
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
          if (data.era_vrc_score.length > 0) {
            const items = this.eras.map((era) => {
              return (
                data.era_vrc_score
                  .filter((row) => row.era === era)
                  .map((v) => parseFloat(v.vrc_score))
                  .reduce((a, b) => a + b) /
                data.era_vrc_score.filter((row) => row.era === era).length
              )
            })
            const dataset = {
              id: 'chain',
              label: 'on-chain validators',
              data: items,
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
      selected_vrc_score: {
        query: gql`
          subscription era_vrc_score($validators: [String!]) {
            era_vrc_score(
              order_by: { era: asc }
              where: { stash_address: { _in: $validators } }
            ) {
              era
              vrc_score
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
          if (data.era_vrc_score.length > 0) {
            const items = this.eras.map((era) => {
              return (
                data.era_vrc_score
                  .filter((row) => row.era === era)
                  .map((v) => parseFloat(v.vrc_score))
                  .reduce((a, b) => a + b) /
                data.era_vrc_score.filter((row) => row.era === era).length
              )
            })
            const dataset = {
              id: 'selected',
              label: 'selected validators',
              data: items,
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

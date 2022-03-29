<template>
  <div v-if="loading" class="text-center py-4">
    <Loading />
  </div>
  <div v-else>
    <ReactiveLineChart
      :chart-data="chartData"
      :options="chartOptions"
      :height="100"
      class="mb-4"
    />
  </div>
</template>
<script>
import { ApiPromise, WsProvider } from '@polkadot/api'
import { BigNumber } from 'bignumber.js'
import Loading from '@/components/Loading.vue'
import ReactiveLineChart from '@/components/charts/ReactiveLineChart.js'
import { config } from '@/frontend.config.js'
export default {
  components: {
    Loading,
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
          text: 'total issuance over the last 30 days',
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
                labelString: 'block',
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
                labelString: 'total issuance',
              },
            },
          ],
        },
      },
      loading: true,
      totalIssuance: [],
      points: 30, // 1 point per day
      historySize: 10 * 1440 * 30, // 30 days
    }
  },
  computed: {
    chartData() {
      return {
        labels: this.totalIssuance.map(({ block }) => block),
        datasets: [
          {
            labels: 'total',
            data: this.totalIssuance.map(({ value }) => value),
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
  async created() {
    const wsProvider = new WsProvider(config.nodeWs)
    const api = await ApiPromise.create({ provider: wsProvider })
    await api.isReady
    // get latest block
    const lastSignedBlock = await api.rpc.chain.getBlock()
    const endBlock = lastSignedBlock.block.header.number
    const startBlock = endBlock - this.historySize
    this.totalIssuance = await this.getTotalIssuanceInRange(
      api,
      startBlock,
      endBlock
    )
    this.loading = false
  },
  methods: {
    async getTotalIssuanceInRange(api, startBlock, endBlock) {
      const blockHashes = []
      // Calculate the step size given the range of blocks and the number of points we want
      const step = Math.floor((endBlock - startBlock) / this.points)
      try {
        // Get all block hashes
        const blockHashPromises = []
        for (let i = startBlock + step; i <= endBlock; i = i + step) {
          if (!blockHashes.find((x) => x.block === i)) {
            const blockHashPromise = api.rpc.chain.getBlockHash(i)
            blockHashPromises.push(i, blockHashPromise)
          }
        }
        const hashResults = await Promise.all(blockHashPromises)
        for (let i = 0; i < hashResults.length; i = i + 2) {
          blockHashes.push({
            block: hashResults[i],
            hash: hashResults[i + 1],
          })
        }
        // console.log('block hashes:', blockHashes)

        const totalIssuancePromises = []

        // Loop over the blocks, using the step value
        for (let i = startBlock + step; i <= endBlock; i = i + step) {
          // If we already have data about that block, skip it
          if (!this.totalIssuance.find((x) => x.block === i)) {
            // Get the block hash
            const blockHash = blockHashes.find((x) => x.block === i).hash
            // Create a promise to query the balance for that block
            const totalIssuancePromise =
              api.query.balances.totalIssuance.at(blockHash)
            // Push data to a linear array of promises to run in parallel.
            totalIssuancePromises.push(i, totalIssuancePromise)
          }
        }

        // Call all promises in parallel for speed.
        const totalIssuanceResults = await Promise.all(totalIssuancePromises)

        // Restructure the data into an array of objects
        const balances = []
        for (let i = 0; i < totalIssuanceResults.length; i = i + 2) {
          const block = totalIssuanceResults[i]
          const totalIssuanceAtBlock = this.formatBalance(
            totalIssuanceResults[i + 1].toString()
          )
          balances.push({
            block,
            value: totalIssuanceAtBlock,
          })
        }
        // console.log('total issuance:', balances)
        return balances
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('error fetching total issuance:', error)
      }
    },
    formatBalance(balance) {
      return parseFloat(
        new BigNumber(balance)
          .div(new BigNumber(10).pow(config.tokenDecimals))
          .toFixed(3)
      )
    },
  },
}
</script>

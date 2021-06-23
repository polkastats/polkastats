<template>
  <div v-if="lastBlock" class="chain-info mb-4">
    <div class="row">
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3">{{ $t('components.network.last_block') }}</h4>
            <nuxt-link
              v-b-tooltip.hover
              :to="`/block?blockNumber=${lastBlock}`"
              title="Click to see block info!"
            >
              <h6 class="d-inline-block">#{{ formatNumber(lastBlock) }}</h6>
            </nuxt-link>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3">
              {{ $t('components.network.last_block_finalized') }}
            </h4>
            <nuxt-link
              v-b-tooltip.hover
              :to="`/block?blockNumber=${lastFinalizedBlock}`"
              title="Click to see block info!"
            >
              <h6 class="d-inline-block">
                #{{ formatNumber(lastFinalizedBlock) }}
              </h6>
            </nuxt-link>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3">Total Extrinsics</h4>
            <nuxt-link
              v-b-tooltip.hover
              to="/extrinsics"
              title="Click to see extrinsics!"
            >
              <h6 class="d-inline-block">
                {{ formatNumber(totalExtrinsics) }}
              </h6>
            </nuxt-link>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3">Total Events</h4>
            <nuxt-link
              v-b-tooltip.hover
              to="/events"
              title="Click to see events!"
            >
              <h6 class="d-inline-block">{{ formatNumber(totalEvents) }}</h6>
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
    <!-- new row -->
    <div class="row">
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3">{{ $t('components.network.accounts') }}</h4>
            <nuxt-link
              v-b-tooltip.hover
              to="/accounts"
              title="Click to see accounts!"
            >
              <h6 class="d-inline-block">
                {{ formatNumber(totalAccounts) }}
              </h6>
            </nuxt-link>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3">
              {{ $t('components.network.transfers') }}
            </h4>
            <nuxt-link
              v-b-tooltip.hover
              to="/transfers"
              title="Click to see tranfers!"
            >
              <h6 class="d-inline-block">{{ formatNumber(totalTransfers) }}</h6>
            </nuxt-link>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3">
              {{ $t('components.network.contracts') }}
            </h4>
            <nuxt-link
              v-b-tooltip.hover
              to="/contracts"
              title="Click to see contracts!"
            >
              <h6 class="d-inline-block">
                {{ formatNumber(totalContracts) }}
              </h6>
            </nuxt-link>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3">
              {{ $t('components.network.total_issuance') }}
            </h4>
            <h6 class="d-inline-block">
              {{ formatAmount(totalIssuance) }}
            </h6>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '../mixins/commonMixin.js'
import { network } from '../frontend.config.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      network,
      lastBlock: 0,
      lastFinalizedBlock: 0,
      totalExtrinsics: 0,
      totalEvents: 0,
      totalAccounts: 0,
      totalContracts: 0,
      totalIssuance: 0,
      totalTransfers: 0,
    }
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks {
            block(order_by: { block_number: desc }, where: {}, limit: 1) {
              block_number
              total_issuance
            }
          }
        `,
        result({ data }) {
          this.lastBlock = data.block[0].block_number
          this.totalIssuance = data.block[0].total_issuance
        },
      },
      finalized: {
        query: gql`
          subscription blocks {
            block(
              limit: 1
              order_by: { block_number: desc }
              where: { finalized: { _eq: true } }
            ) {
              block_number
            }
          }
        `,
        result({ data }) {
          this.lastFinalizedBlock = data.block[0].block_number
        },
      },
      total: {
        query: gql`
          subscription total {
            total {
              name
              count
            }
          }
        `,
        result({ data }) {
          this.totalExtrinsics =
            data.total.find((row) => row.name === 'extrinsics').count || 0
          this.totalTransfers =
            data.total.find((row) => row.name === 'transfers').count || 0
          this.totalEvents =
            data.total.find((row) => row.name === 'events').count || 0
          // this.totalContracts =
          //   data.total.find((row) => row.name === 'contracts').count || 0
        },
      },
      accounts: {
        query: gql`
          subscription account_aggregate {
            account_aggregate {
              aggregate {
                count
              }
            }
          }
        `,
        result({ data }) {
          this.totalAccounts = parseInt(data.account_aggregate.aggregate.count)
        },
      },
    },
  },
}
</script>

<style>
.chain-info .card {
  box-shadow: 0 8px 20px 0 rgb(40 133 208 / 15%);
}
</style>

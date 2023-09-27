<template>
  <div v-if="lastBlock" class="chain-info mb-4">
    <div class="row">
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3 title">
              {{ $t('components.network.last_block') }}
            </h4>
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
            <h4 class="mb-3 title">
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
            <h4 class="mb-3 title">Total Extrinsics</h4>
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
            <h4 class="mb-3 title">Total Events</h4>
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
            <h4 class="mb-3 title">
              {{ $t('components.network.current_index') }}
            </h4>
            <h6 class="d-inline-block">
              {{ formatNumber(currentIndex) }}
            </h6>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3 title">
              {{ $t('components.network.signedTransactions') }}
            </h4>
            <h6 class="d-inline-block">
              {{ formatNumber(totalSignedExtrinsics) }}
            </h6>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3 title">
              {{ $t('components.network.active_era') }}
            </h4>
            <h6 class="d-inline-block">
              {{ formatNumber(activeEra) }}
            </h6>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3 title">
              {{ $t('components.network.total_supply') }}
            </h4>
            <h6 class="d-inline-block">
              {{ formatAmount(totalIssuance) }}
              <FIATConversion :units="totalIssuance.toString()" :short="true" />
            </h6>
          </div>
        </div>
      </div>
    </div>
    <!-- new row -->
    <div class="row">
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3 title">
              {{ $t('components.network.total_staked') }}
            </h4>
            <h6 class="d-inline-block">
              {{ formatAmount(totalStaked, 0, true) }}
              <FIATConversion :units="totalStaked.toString()" :short="true" />
              ({{ formatNumber(totalStakedPercentage) }}%)
            </h6>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3 title">
              {{ $t('components.network.active_validators') }}
            </h4>
            <h6 class="d-inline-block">
              {{ formatNumber(totalValidators) }}
            </h6>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3 title">
              {{ $t('components.network.waiting_validators') }}
            </h4>
            <h6 class="d-inline-block">
              {{ formatNumber(totalWaiting) }}
            </h6>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3 title">
              {{ $t('components.network.nominators') }}
            </h4>
            <h6 class="d-inline-block">
              {{ formatNumber(totalNominators) }}
            </h6>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import BN from 'bn.js'
import commonMixin from '../mixins/commonMixin.js'
import { network } from '../frontend.config.js'
import FIATConversion from '@/components/FIATConversion'

export default {
  components: [FIATConversion],
  mixins: [commonMixin],
  data() {
    return {
      network,
      lastBlock: 0,
      lastFinalizedBlock: 0,
      currentIndex: 0,
      activeEra: 0,
      totalExtrinsics: 0,
      totalEvents: 0,
      totalAccounts: 0,
      totalIssuance: 0,
      totalSignedExtrinsics: 0,
      totalStaked: 0,
      totalValidators: 0,
      totalWaiting: 0,
      totalNominators: 0,
      minStake: 0,
      totalTransactionsFees: 0,
    }
  },
  computed: {
    totalStakedPercentage() {
      if (this.totalStaked && this.totalIssuance) {
        const totalIssuance = new BN(this.totalIssuance.toString(), 10)
        const totalStaked = new BN(this.totalStaked, 10).mul(new BN('100', 10))
        return totalStaked.div(totalIssuance).toString(10)
      }
      return 0
    },
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks {
            block(order_by: { block_number: desc }, where: {}, limit: 1) {
              block_number
              total_issuance
              current_index
              active_era
            }
          }
        `,
        result({ data }) {
          this.lastBlock = data.block[0].block_number
          this.totalIssuance = data.block[0].total_issuance
          this.currentIndex = data.block[0].current_index
          this.activeEra = data.block[0].active_era
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
            data.total.find((row) => row.name === 'extrinsics')?.count || 0
          this.totalSignedExtrinsics =
            data.total.find((row) => row.name === 'signed_extrinsics')?.count ||
            0
          this.totalEvents =
            data.total.find((row) => row.name === 'events')?.count || 0
          this.totalValidators =
            data.total.find((row) => row.name === 'active_validator_count')
              ?.count || 0
          this.totalWaiting =
            data.total.find((row) => row.name === 'waiting_validator_count')
              ?.count || 0
          this.totalNominators =
            data.total.find((row) => row.name === 'nominator_count')?.count || 0
          this.minStake =
            data.total.find((row) => row.name === 'minimum_stake')?.count || 0
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
      totalStaked: {
        query: gql`
          subscription ranking_aggregate {
            ranking_aggregate(where: { active: { _eq: true } }) {
              aggregate {
                sum {
                  total_stake
                }
              }
            }
          }
        `,
        result({ data }) {
          this.totalStaked =
            data.ranking_aggregate.aggregate.sum.total_stake.toString()
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
.title {
  font-size: 1.4rem;
}
</style>

<template>
  <div v-if="lastBlock" class="row">
	  <score-item
	  :title="$t('components.chain.last_block')"
	  :link="localePath(`/block?blockNumber=${lastBlock}`)"
	  :description="$t('components.chain.block_details')"
	  :value="'#' + formatNumber(lastBlock)"
	  icon="cube"
	   />
	   <score-item
	  :title="$t('components.chain.last_block_finalized')"
	  :link="localePath(`/block?blockNumber=${lastFinalizedBlock}`)"
	  :description="$t('components.chain.block_details')"
	  :value="'#' + formatNumber(lastFinalizedBlock)"
	  icon="lock"
	   />

	   <score-item
	  :title="$t('components.chain.total_extrinsics')"
	  :link="localePath('/extrinsics')"
	  :description="$t('components.chain.extrinsics_details')"
	  :value="formatNumber(totalExtrinsics)"
	  icon="hand-holding-usd"
	   />

	   <score-item
	  :title="$t('components.chain.total_events')"
	  :link="localePath('/events')"
	  :description="$t('components.chain.events_details')"
	  :value="formatNumber(totalEvents)"
	  icon="history"
	   />

	   <score-item
	  :title="$t('components.chain.accounts')"
	  :link="localePath('/accounts')"
	  :description="$t('components.chain.accounts_details')"
	  :value="formatNumber(totalAccounts)"
	  icon="user"
	   />

	   <score-item
	  :title="$t('components.chain.transfers')"
	  :link="localePath('/transfers')"
	  :description="$t('components.chain.transfers_details')"
	  :value="formatNumber(totalTransfers)"
	  icon="exchange-alt"
	   />

	   <score-item
	  :title="$t('components.chain.active_era')"
	  :value="formatNumber(activeEra)"
	  icon="signature"
	   />

	   <score-item
	  :title="$t('components.chain.total_issuance')"
	  :value="formatAmount(totalIssuance, 0, true)"
	  icon="chart-line"
	   >
	   	<FIATConversion :units="totalIssuance" :short="true" variant="i-fourthB" class="mt-1 small" />
	   </score-item>

	   <score-item
	  :title="$t('components.chain.total_staked')"
	  :value="formatAmount(totalStaked, 0, true) + ' ' + formatNumber(totalStakedPercentage) + '%'"
	  icon="chart-area"
	   >
		<FIATConversion :units="totalStaked" :short="true" variant="i-fourthB" class="mt-1 small" />
	   </score-item>

	   <score-item
	  :title="$t('components.chain.current_index')"
	  :value="formatNumber(currentIndex)"
	  icon="clock"
	   />

	   <score-item
	  :title="$t('components.chain.validators')"
	  :value="formatNumber(totalValidators) + ' / ' + formatNumber(totalWaiting)"
	  icon="users"
	   />

	   <score-item
	  :title="$t('components.chain.nominators')"
	  :value="formatNumber(totalNominators)"
	  icon="user-friends"
	   />
  </div>
	<footer v-else>
		<Loading />
	</footer>
</template>

<script>
import { gql } from 'graphql-tag'
import BN from 'bn.js'
import Loading from '@/components/Loading.vue'
import ScoreItem from '@/components/more/ScoreItem.vue'
import commonMixin from '@//mixins/commonMixin.js'
import { config } from '@//frontend.config.js'

export default {
  components: { Loading, ScoreItem },
  mixins: [commonMixin],
  data() {
    return {
      config,
      lastBlock: 0,
      lastFinalizedBlock: 0,
      currentIndex: 0,
      activeEra: 0,
      totalExtrinsics: 0,
      totalEvents: 0,
      totalAccounts: 0,
      totalIssuance: 0,
      totalTransfers: 0,
      totalStaked: 0,
      totalValidators: 0,
      totalWaiting: 0,
      totalNominators: 0,
      minStake: 0,
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
            data.total.find((row) => row.name === 'extrinsics').count || 0
          this.totalTransfers =
            data.total.find((row) => row.name === 'transfers').count || 0
          this.totalEvents =
            data.total.find((row) => row.name === 'events').count || 0
          this.totalValidators =
            data.total.find((row) => row.name === 'active_validator_count')
              .count || 0
          this.totalWaiting =
            data.total.find((row) => row.name === 'waiting_validator_count')
              .count || 0
          this.totalNominators =
            data.total.find((row) => row.name === 'nominator_count').count || 0
          this.minStake =
            data.total.find((row) => row.name === 'minimum_stake').count || 0
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
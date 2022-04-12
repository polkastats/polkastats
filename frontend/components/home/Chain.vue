<template>
  <div v-if="lastBlock">
      <p>
		<em>{{ $t('components.chain.last_block') }}</em>
		<strong>
			<nuxt-link
			  v-b-tooltip.hover
			  :to="localePath(`/block?blockNumber=${lastBlock}`)"
			  :title="$t('components.chain.block_details')"
			>
				#{{ formatNumber(lastBlock) }}
			</nuxt-link>
		</strong>
      </p>
      <p >
		<em>{{ $t('components.chain.last_block_finalized') }}</em>
		<strong>
			<nuxt-link
			  v-b-tooltip.hover
			  :to="localePath(`/block?blockNumber=${lastBlock}`)"
			  :title="$t('components.chain.block_details')"
			>
				#{{ formatNumber(lastFinalizedBlock) }}
			</nuxt-link>
		</strong>
      </p>
      <p>
		<em>{{ $t('components.chain.total_extrinsics') }}</em>
		<strong>
			<nuxt-link
			  v-b-tooltip.hover
              :to="localePath('/extrinsics')"
              :title="$t('components.chain.extrinsics_details')"
			>
				{{ formatNumber(totalExtrinsics) }}
			</nuxt-link>
		</strong>
      </p>
      <p>
		<em>{{ $t('components.chain.total_events') }}</em>
		<strong>
			<nuxt-link
			  v-b-tooltip.hover
              :to="localePath('/events')"
              :title="$t('components.chain.events_details')"
			>
				{{ formatNumber(totalEvents) }}
			</nuxt-link>
		</strong>
      </p>

      <p>
		<em>{{ $t('components.chain.accounts') }}</em>
		<strong>
			<nuxt-link
			  v-b-tooltip.hover
              :to="localePath('/accounts')"
              :title="$t('components.chain.accounts_details')"
			>
				{{ formatNumber(totalAccounts) }}
			</nuxt-link>
		</strong>
      </p>
      <p>
		<em>{{ $t('components.chain.transfers') }}</em>
		<strong>
			<nuxt-link
			  v-b-tooltip.hover
              :to="localePath('/transfers')"
              :title="$t('components.chain.transfers_details')"
			>
				{{ formatNumber(totalTransfers) }}
			</nuxt-link>
		</strong>
      </p>
      <p>
		<em>{{ $t('components.chain.active_era') }}</em>
		<strong>{{ formatNumber(activeEra) }}</strong>
      </p>
      <p>
		<em>{{ $t('components.chain.total_issuance') }}</em>
		<strong>
			{{ formatAmount(totalIssuance, 0, true) }}
			<FIATConversion :units="totalIssuance" :short="true" />
		</strong>
      </p>

      <p>
		<em>{{ $t('components.chain.total_staked') }}</em>
		<strong>
			{{ formatAmount(totalStaked, 0, true) }}
			<FIATConversion :units="totalStaked" :short="true" />
			({{ formatNumber(totalStakedPercentage) }}%)
		</strong>
      </p>
      <p>
		<em>{{ $t('components.chain.current_index') }}</em>
		<strong>{{ formatNumber(currentIndex) }}</strong>
      </p>
      <p>
		<em>{{ $t('components.chain.validators') }}</em>
		<strong>
			{{ formatNumber(totalValidators) }} /
			{{ formatNumber(totalWaiting) }}
		</strong>
      </p>
      <p>
		<em>{{ $t('components.chain.nominators') }}</em>
		<strong>{{ formatNumber(totalNominators) }}</strong>
      </p>
  </div>
	<footer v-else>
		<Loading />
	</footer>
</template>

<script>
import { gql } from 'graphql-tag'
import BN from 'bn.js'
import Loading from '@/components/Loading.vue'
import commonMixin from '@//mixins/commonMixin.js'
import { config } from '@//frontend.config.js'

export default {
	components: [Loading],
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

<style lang="scss" scoped>

	@use '/assets/scss/polkadot/variables/colors/colors.scss' as COLOR;
	@use '/assets/scss/polkadot/variables/fonts/families.scss' as FONT;

	p
	{
		margin: 0;
		
		em
		{
			font-weight: 500;
			text-transform: uppercase;
			white-space: nowrap;
			margin: 0;
			display: block;
			font-style: normal;
			color: COLOR.$fourthB;
	
			&::before
			{
				content: "";
				display: inline-block;
				width: 0.8em;
				height: 0.8em;
				margin-right: 0.8em;
				border: 0.2em solid COLOR.$fifth;
				transform: rotate(25deg);
			}
		}
	
		strong
		{
			color: COLOR.$fifth;
			font-size: 1.4em;
			margin-left: 1.2em;
			font-weight: normal;
			font-family: FONT.$secondary;
			white-space: nowrap;

			> a:hover
			{
				color: inherit;
			}
		}
	}

</style>
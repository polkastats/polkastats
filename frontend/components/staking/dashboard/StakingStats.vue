<template>
  <div class="chain-info mb-4">
    <div class="row">
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="mb-3">
              {{ $t('components.staking_stats.active_waiting_validators') }}
            </h5>
            <nuxt-link
              v-b-tooltip.hover
              :to="localePath(`/staking/validators`)"
              :title="$t('components.staking_stats.goto_validators')"
            >
              <h6 class="d-inline-block">
                {{ activeValidatorCount }}/{{ waitingValidatorCount }}
              </h6>
            </nuxt-link>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="mb-3">
              {{ $t('components.staking_stats.current_era') }}
            </h5>
            <h6 class="d-inline-block">
              {{ formatNumber(currentEra) }}
            </h6>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="mb-3">
              {{ $t('components.staking_stats.nominators') }}
            </h5>
            <h6 class="d-inline-block">
              {{ formatNumber(nominatorCount) }}
            </h6>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-6 col-lg-3 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="mb-3">
              {{ $t('components.staking_stats.minimum_stake') }}
            </h5>
            <h6 class="d-inline-block">
              {{ formatAmount(minimumStake, 3) }}
            </h6>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      activeValidatorCount: 0,
      waitingValidatorCount: 0,
      nominatorCount: 0,
      currentEra: 0,
      minimumStake: 0,
    }
  },
  apollo: {
    $subscribe: {
      activeValidatorCount: {
        query: gql`
          subscription total {
            total(
              where: { name: { _eq: "active_validator_count" } }
              limit: 1
            ) {
              count
            }
          }
        `,
        result({ data }) {
          this.activeValidatorCount = data.total[0].count
        },
      },
      waitingValidatorCount: {
        query: gql`
          subscription total {
            total(
              where: { name: { _eq: "waiting_validator_count" } }
              limit: 1
            ) {
              count
            }
          }
        `,
        result({ data }) {
          this.waitingValidatorCount = data.total[0].count
        },
      },
      nominatorCount: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "nominator_count" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          this.nominatorCount = data.total[0].count
        },
      },
      currentEra: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "current_era" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          this.currentEra = data.total[0].count
        },
      },
      minimumStake: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "minimum_stake" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          this.minimumStake = data.total[0].count
        },
      },
    },
  },
}
</script>

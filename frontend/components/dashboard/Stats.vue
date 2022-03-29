<template>
  <div class="row text-center dashboard-global-stats">
    <div class="col-lg-6 col-xl-3 mb-4">
      <div class="box">
        <h6>Active/waiting val</h6>
        <span class="stat"
          >{{ activeValidatorCount }}/{{ waitingValidatorCount }}</span
        >
      </div>
    </div>
    <div class="col-lg-6 col-xl-3 mb-4">
      <div class="box">
        <h6>Current era</h6>
        <span class="stat">{{ formatNumber(currentEra) }}</span>
      </div>
    </div>
    <div class="col-lg-6 col-xl-3 mb-4">
      <div class="box">
        <h6>Nominators</h6>
        <span class="stat">{{ formatNumber(nominatorCount) }}</span>
      </div>
    </div>
    <div class="col-lg-6 col-xl-3 mb-4">
      <div class="box">
        <h6>Minimum stake</h6>
        <span class="stat">{{ formatAmount(minimumStake, 3) }}</span>
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

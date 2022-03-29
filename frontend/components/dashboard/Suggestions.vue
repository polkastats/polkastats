<template>
  <div>
    <b-alert
      v-for="(suggestion, index) in suggestions"
      :key="`suggestion-${index}`"
      show
      dismissible
      variant="warning"
    >
      <p class="text-center my-2">{{ suggestion }}</p>
    </b-alert>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import { config } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  props: {
    validators: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      config,
      suggestions: [],
    }
  },
  apollo: {
    $subscribe: {
      validators: {
        query: gql`
          subscription ranking($validators: [String!]) {
            ranking(where: { stash_address: { _in: $validators } }) {
              stash_address
              name
              commission_history
              payout_history
              slashed
              relative_performance
            }
          }
        `,
        variables() {
          return {
            validators: this.validators,
          }
        },
        skip() {
          return this.validators.length === 0
        },
        result({ data }) {
          if (data.ranking.length > 0) {
            const localSuggestions = []
            this.validators.forEach((validatorAddress) => {
              // commission
              const validator = data.ranking.find(
                (validator) => validator.stash_address === validatorAddress
              )
              const commissionHistory =
                JSON.parse(validator.commission_history).filter(
                  ({ commission }) => commission
                ) || []
              const firstCommission = commissionHistory[0]
              const lastCommission =
                commissionHistory[commissionHistory.length - 1]
              if (
                parseFloat(lastCommission.commission) >
                parseFloat(firstCommission.commission)
              ) {
                localSuggestions.push(
                  `Validator ${validatorAddress}, which is included in your current on-chain set, increased its commission from ${firstCommission.commission}% to ${lastCommission.commission}%`
                )
              }

              // payouts
              const payoutHistory =
                JSON.parse(
                  data.ranking.find(
                    (validator) => validator.stash_address === validatorAddress
                  ).payout_history
                ) || []
              const pendingPayouts = payoutHistory.filter(
                (payout) => payout.status === 'pending'
              ).length
              // true when the validator has rewards next to expire in the next 24h
              const payoutAlert =
                payoutHistory
                  .slice(0, config.erasPerDay)
                  .filter((payout) => payout.status === 'pending').length > 0
              if (payoutAlert) {
                localSuggestions.push(
                  `Validator ${
                    validator.name + ' '
                  }${validatorAddress}, which is included in your current on-chain set, has ${pendingPayouts} pending rewards and some of them are next to expire in the next 24h`
                )
              }

              // slashes
              if (validator.slashed) {
                localSuggestions.push(
                  `Validator ${
                    validator.name + ' '
                  }${validatorAddress}, which is included in your current on-chain set, was slashed in the last 84 eras`
                )
              }

              // performance
              if (validator.relative_performance < 0.5) {
                localSuggestions.push(
                  `Validator ${
                    validator.name + ' '
                  }${validatorAddress}, which is included in your current on-chain set, performs below network average`
                )
              }
            })
            this.suggestions = localSuggestions
          }
        },
      },
    },
  },
}
</script>

<template>
  <div class="page metrics-page container-fluid py-3">
    <div>
      <h1 class="mb-4">Ranking score metrics</h1>
      <p>The ranking score is based on this on-chain metrics:</p>
      <div
        v-for="metric in metrics"
        :id="metric.id"
        :key="metric.title"
        class="pt-2 pb-3"
      >
        <h4>{{ metric.title }}</h4>
        <hr class="pb-1" />
        <p>{{ metric.description }}</p>
        <h6>How it's rated?</h6>
        <b-table hover :items="metric.rating" class="my-4">
          <template #cell(rating)="data">
            <Rating :rating="data.item.rating" />
          </template>
        </b-table>
      </div>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import { config } from '@/config.js'
export default {
  mixins: [commonMixin],
  data() {
    return {
      config,
      metrics: [
        {
          id: 'elected',
          title: 'Elected',
          description:
            'Evaluate if the validator is currently included in the active validator set.',
          rating: [
            {
              rating: 0,
              description: 'Validator is waiting',
            },
            {
              rating: 2,
              description: 'Validator is active',
            },
          ],
        },
        {
          id: 'identity',
          title: 'Identity',
          description:
            'Evaluate the quality of the identity data provided by the validator.',
          rating: [
            {
              rating: 0,
              description: "Doesn't have an identity set",
            },
            {
              rating: 1,
              description: "Have an identity set but it's not verified",
            },
            {
              rating: 2,
              description: 'Have an verified identity set',
            },
            {
              rating: 3,
              description:
                'Have an verified identity set and provides possible information (legal, email, web, riot and twitter)',
            },
          ],
        },
        {
          id: 'address',
          title: 'Address creation date',
          description:
            'The older the address is, the more trustable it might be. The best value (older address) between the validator stash address and its parent identity address will be used for rating this metric.',
          rating: [
            {
              rating: 0,
              description: 'addressCreationBlock >= (blockHeight / 4) * 3',
            },
            {
              rating: 1,
              description:
                'addressCreationBlock > (blockHeight / 4) * 2 && addressCreationBlock <= (blockHeight / 4) * 3',
            },
            {
              rating: 2,
              description:
                'addressCreationBlock > blockHeight / 4 && addressCreationBlock <= (blockHeight / 4) * 2',
            },
            {
              rating: 3,
              description: 'addressCreationBlock <= blockHeight / 4',
            },
          ],
        },
        {
          id: 'slashes',
          title: 'Slashes over time',
          description:
            'Evaluate if the validator was slashed in the last 84 eras (21 days)',
          rating: [
            {
              rating: 0,
              description: 'Validator was slashed',
            },
            {
              rating: 2,
              description: 'Validator was not slashed',
            },
          ],
        },
        {
          id: 'subaccounts',
          title: 'Subaccounts',
          description:
            'Evaluate if the validator uses subaccounts, this can be considered a more orderly way to set up a validator and good practice.',
          rating: [
            {
              rating: 0,
              description: "Validator doesn't use a sub-identity",
            },
            {
              rating: 2,
              description: 'Validator uses a sub-identity',
            },
          ],
        },
        {
          id: 'nominators',
          title: 'Nominators',
          description:
            'The number of nominators shows trust on the validator setup but decreases rewards in the long run.',
          rating: [
            {
              rating: 0,
              description: 'Validator has no nominators or is oversubscribed',
            },
            {
              rating: 2,
              description:
                "Validator have 1 or more nominators and it's not oversubscribed",
            },
          ],
        },
        {
          id: 'erapoints',
          title: 'Era points',
          description:
            'Average era points relative to set size over last 28 eras (1 week)',
          rating: [
            {
              rating: 0,
              description: 'Validator is earning era points below average',
            },
            {
              rating: 2,
              description: 'Validator is earning era points above average',
            },
          ],
        },
        {
          id: 'commission',
          title: 'Commission over time',
          description: 'Commission changes over last 84 eras (21 days)',
          rating: [
            {
              rating: 0,
              description: 'Commission is 100% or 0%',
            },
            {
              rating: 1,
              description: 'Commission is greater than 10% and less than 100%',
            },
            {
              rating: 2,
              description:
                'Commission is greater than 5% and less or equal than 10%',
            },
            {
              rating: 3,
              description:
                'Commission is less or equal than 5% or is greater than 5% and less or equal than 10% and decrease over time',
            },
          ],
        },
        {
          id: 'payouts',
          title: 'Frecuency of payouts',
          description:
            'The more frequent the payout, the more frequent nominators will get rewarded, which can transform a validator into an attractive one.',
          rating: [
            {
              rating: 0,
              description: 'No reward distribution detected in history',
            },
            {
              rating: 1,
              description:
                'Reward distribution detected between the last 3-7 days',
            },
            {
              rating: 2,
              description: 'Reward distribution detected in the last 3 days',
            },
            {
              rating: 3,
              description: 'Reward distribution detected in the 24 hours',
            },
          ],
        },
        {
          id: 'governance',
          title: 'Governance participation',
          description:
            'If the validator stash address or its super identity address is backing at least one council member and is voting in a current democracy proposal or referendum.',
          rating: [
            {
              rating: 0,
              description: 'No participating in governance',
            },
            {
              rating: 2,
              description:
                'Validator is backing a council member or is participating in a current proposal or referendum (as proposer or voter)',
            },
            {
              rating: 3,
              description:
                'Validator is backing a council member and is participating in a current proposal or referendum (as proposer or voter)',
            },
          ],
        },
      ],
    }
  },
  head() {
    return {
      title: `Metrics | ${config.title} for ${this.capitalize(config.name)}`,
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'List of metrics and ranking criteria',
        },
      ],
    }
  },
}
</script>

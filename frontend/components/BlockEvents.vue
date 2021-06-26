<template>
  <div v-if="parsedEvents.length > 0">
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>{{ $t('details.block.section') }}</th>
            <th>{{ $t('details.block.method') }}</th>
            <th>{{ $t('details.block.phase') }}</th>
            <th>{{ $t('details.block.data') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in parsedEvents" :key="event.event_index">
            <td>{{ event.section }}</td>
            <td>{{ event.method }}</td>
            <td>{{ event.phase }}</td>
            <td>
              <template
                v-if="
                  event.section === `balances` && event.method === `Transfer`
                "
              >
                <Identicon :address="JSON.parse(event.data)[0]" :size="20" />
                <nuxt-link
                  v-b-tooltip.hover
                  :to="`/account/${JSON.parse(event.data)[0]}`"
                  :title="$t('details.block.account_details')"
                >
                  {{ shortAddress(JSON.parse(event.data)[0]) }}
                </nuxt-link>
                <font-awesome-icon icon="arrow-right" />
                <Identicon :address="JSON.parse(event.data)[1]" :size="20" />
                <nuxt-link
                  v-b-tooltip.hover
                  :to="`/account/${JSON.parse(event.data)[1]}`"
                  :title="$t('details.block.account_details')"
                >
                  {{ shortAddress(JSON.parse(event.data)[1]) }}
                </nuxt-link>
                <font-awesome-icon icon="arrow-right" />
                <span class="amount">
                  {{ formatAmount(JSON.parse(event.data)[2]) }}
                </span>
              </template>
              <template v-else>
                {{ event.data }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  props: {
    blockNumber: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      loading: true,
      parsedEvents: [],
    }
  },
  apollo: {
    $subscribe: {
      event: {
        query: gql`
          subscription event($block_number: bigint!) {
            event(where: { block_number: { _eq: $block_number } }) {
              block_number
              data
              event_index
              method
              phase
              section
            }
          }
        `,
        variables() {
          return {
            block_number: this.$route.query.blockNumber,
          }
        },
        result({ data }) {
          this.parsedEvents = data.event
        },
      },
    },
  },
}
</script>
<style scoped>
td {
  word-break: break-all;
}
</style>

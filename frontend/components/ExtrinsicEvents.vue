<template>
  <div class="last-events">
    <h4 class="my-4">Triggered events</h4>
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="events">
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              v-b-tooltip.hover
              :to="`/block?blockNumber=${data.item.block_number}`"
              title="Check block information"
            >
              #{{ formatNumber(data.item.block_number) }}-{{
                data.item.event_index
              }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(section)="data">
          <p class="mb-0">
            {{ data.item.section }} ➡
            {{ data.item.method }}
          </p>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import { gql } from 'graphql-tag'

export default {
  mixins: [commonMixin],
  props: {
    blockNumber: {
      type: Number,
      default: () => 0,
    },
    extrinsicIndex: {
      type: Number,
      default: () => 0,
    },
  },
  data: () => {
    return {
      events: [],
      fields: [
        {
          key: 'block_number',
          label: 'Id',
          sortable: true,
        },
        {
          key: 'section',
          label: 'Event',
          sortable: true,
        },
        {
          key: 'section',
          label: 'Event',
          sortable: true,
        },
        {
          key: 'data',
          label: 'Data',
          sortable: true,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      event: {
        query: gql`
          subscription events($block_number: bigint!, $phase: String!) {
            event(
              order_by: { block_number: desc }
              where: {
                block_number: { _eq: $block_number }
                phase: { _eq: $phase }
              }
              limit: 10
            ) {
              block_number
              event_index
              data
              method
              phase
              section
            }
          }
        `,
        variables() {
          return {
            block_number: parseInt(this.blockNumber),
            phase: `{"applyExtrinsic":${this.extrinsicIndex}}`,
          }
        },
        result({ data }) {
          this.events = data.event
        },
      },
    },
  },
}
</script>

<style>
.last-events .table th,
.last-events .table td {
  padding: 0.45rem;
}
.last-events .table thead th {
  border-bottom: 0;
}
.last-events .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>

<template>
  <div class="extrinsic-events">
    <h4 class="my-4">Triggered events</h4>
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="events">
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              :to="`/event/${data.item.block_number}/${data.item.event_index}`"
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
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'

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

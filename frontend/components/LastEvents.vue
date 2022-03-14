<template>
  <div class="last-events">
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
      ],
    }
  },
  apollo: {
    $subscribe: {
      event: {
        query: gql`
          subscription events {
            event(order_by: { block_number: desc }, where: {}, limit: 10) {
              block_number
              event_index
              data
              method
              phase
              section
            }
          }
        `,
        result({ data }) {
          this.events = data.event
        },
      },
    },
  },
}
</script>

<template>
	<table-component :items="events" :fields="fields" :options="options">
		<template #cell(block_number)="data">
            <nuxt-link
              :to="`/event/${data.item.block_number}/${data.item.event_index}`"
            >
              #{{ formatNumber(data.item.block_number) }}-{{
                data.item.event_index
              }}
            </nuxt-link>
        </template>
        <template #cell(section)="data">
		  <span>{{ data.item.section }}</span>
		  <span>{{ data.item.method }}</span>
        </template>
	</table-component>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import TableComponent from './more/TableComponent.vue'

export default {
	components: { TableComponent },
  mixins: [commonMixin],
  data: () => {
    return {
		options:
		{
			title: 'Last events',
			link: '/events'
		},
      events: [],
      fields: [
        {
          key: 'block_number',
          label: 'Id',
          sortable: false,
        },
        {
          key: 'section',
          label: 'Event',
          sortable: false,
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

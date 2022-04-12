<template>
	<table-component :items="blocks" :fields="fields" :options="options">
		<template #cell(block_number)="data">
			<nuxt-link
				v-b-tooltip.hover
				:to="`/block?blockNumber=${data.item.block_number}`"
				title="Check block information"
				class="tag"
				>
				#{{ formatNumber(data.item.block_number) }}
				</nuxt-link>
        </template>
        <template #cell(finalized)="data">
          <p v-if="data.item.finalized">
            <font-awesome-icon icon="check" class="text-success" />
            Finalized
          </p>
          <p v-else>
            <font-awesome-icon icon="spinner" class="text-light" spin />
            Processing
          </p>
        </template>
        <template #cell(block_hash)="data">
            {{ shortHash(data.item.block_hash) }}
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
			title: 'Last Blocks',
			color: 'primary',
			link: '/blocks'
		},
      blocks: [],
      fields: [
        {
          key: 'block_number',
          label: 'Block',
          sortable: false,
        },
        {
          key: 'finalized',
          label: 'Status',
          sortable: false,
        },
        {
          key: 'block_hash',
          label: 'Hash',
          sortable: false,
        },
        {
          key: 'total_extrinsics',
          label: 'Extrinsics',
          sortable: false,
        },
        {
          key: 'total_events',
          label: 'Events',
          sortable: false,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks {
            block(order_by: { block_number: desc }, where: {}, limit: 10) {
              block_number
              finalized
              block_hash
              total_extrinsics
              total_events
            }
          }
        `,
        result({ data }) {
          this.blocks = data.block
        },
      },
    },
  },
}
</script>

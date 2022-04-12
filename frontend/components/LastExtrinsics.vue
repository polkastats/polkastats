<template>
	<table-component :items="extrinsics" :fields="fields" :options="options">
		<template #cell(block_number)="data">
            <nuxt-link
              v-b-tooltip.hover
              :to="`/extrinsic/${data.item.block_number}/${data.item.extrinsic_index}`"
              title="Check extrinsic information"
            >
              #{{ formatNumber(data.item.block_number) }}-{{
                data.item.extrinsic_index
              }}
            </nuxt-link>
        </template>
        <template #cell(hash)="data">
            {{ shortHash(data.item.hash) }}
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
  data() {
    return {
		options:
		{
			title: 'Last extrinsics',
			link: '/extrinsics'
		},
      extrinsics: [],
      fields: [
        {
          key: 'block_number',
          label: 'Id',
          sortable: false,
        },
        {
          key: 'hash',
          label: 'Hash',
          sortable: false,
        },
        {
          key: 'section',
          label: 'Extrinsic',
          sortable: false,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics {
            signed_extrinsic(
              order_by: { block_number: desc }
              where: {}
              limit: 10
            ) {
              block_number
              extrinsic_index
              signer
              section
              method
              hash
              doc
            }
          }
        `,
        result({ data }) {
          this.extrinsics = data.signed_extrinsic
        },
      },
    },
  },
}
</script>

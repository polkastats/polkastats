<template>
	<table-component :items="blocks" :fields="fields" :options="options">
		<template #cell(block_number)="data">
			<nuxt-link
				v-b-tooltip.hover
				:to="localePath(`/block?blockNumber=${data.item.block_number}`)"
				:title="$t('common.block_details')"
				>
				#{{ formatNumber(data.item.block_number) }}
				</nuxt-link>
        </template>
        <template #cell(finalized)="data">
          <span v-if="data.item.finalized">
            <font-awesome-icon icon="check" class="text-success" />
            {{ $t('common.finalized') }}
          </span>
          <span v-else>
            <font-awesome-icon icon="spinner" class="text-light" spin />
            {{ $t('common.processing') }}
          </span>
        </template>
        <template #cell(block_hash)="data">
            {{ shortHash(data.item.block_hash) }}
        </template>
	</table-component>

</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import TableComponent from '@/components/more/TableComponent.vue'

export default {
	components: { TableComponent },
  mixins: [commonMixin],
  data() {

  	const THAT = this;

    return {
		options:
		{
			get title() { return THAT.$t('components.last_blocks.title') },
			get tooltip(){ THAT.$t('components.last_blocks.blocks_details') },
			variant: 'i-fourth',
			link: this.localePath(`/blocks`)
		},
      blocks: [],
      fields: [
        {
		  variant: 'i-primary',
		  class: 'important',
          key: 'block_number',
          get label(){ return THAT.$t('components.last_blocks.block_number') },
          sortable: false,
        },
        {
          key: 'finalized',
          get label(){ return THAT.$t('components.last_blocks.status') },
          sortable: false,
        },
        {
          key: 'block_hash',
          get label(){ return THAT.$t('components.last_blocks.hash') },
          sortable: false,
        },
        {
          key: 'total_extrinsics',
          get label(){ return THAT.$t('components.last_blocks.total_extrinsics') },
          sortable: false,
        },
        {
          key: 'total_events',
          get label(){ return THAT.$t('components.last_blocks.total_events') },
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
            block(order_by: { block_number: desc }, limit: 10) {
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

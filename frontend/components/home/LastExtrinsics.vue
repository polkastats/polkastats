<template>
	<table-component :items="extrinsics" :fields="fields" :options="options">
		<template #cell(block_number)="data">
            <nuxt-link
              v-b-tooltip.hover
              :to="
                localePath(
                  `/extrinsic/${data.item.block_number}/${data.item.extrinsic_index}`
                )
              "
              :title="$t('components.last_extrinsics.extrinsic_details')"
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
			<div class="timeline" variant="i-primary">
				<span class="timeline-item">{{ data.item.section }}</span>
				<span class="timeline-item">{{ data.item.method }}</span>
			</div>
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
			get title(){ return THAT.$t('components.last_extrinsics.title') },
			get tooltip(){ return THAT.$t('components.last_extrinsics.extrinsics_details') },
			link: '/extrinsics',
			variant: 'i-secondary',
		},
      extrinsics: [],
      fields: [
        {
          key: 'block_number',
          get label(){ return THAT.$t('components.last_extrinsics.id') },
          sortable: false,
		  class: 'highlighted'
        },
        {
          key: 'hash',
          get label(){ return THAT.$t('components.last_extrinsics.hash') },
          sortable: false,
        },
        {
          key: 'section',
          get label(){ return THAT.$t('components.last_extrinsics.extrinsic') },
          sortable: false,
		  class:'expanded',
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics {
            signed_extrinsic(order_by: { block_number: desc }, limit: 10) {
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

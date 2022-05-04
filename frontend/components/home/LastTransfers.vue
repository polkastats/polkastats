<template>
	<table-component :items="transfers" :fields="fields" :options="options">

		<template #cell(hash)="data">
            <nuxt-link :to="`/transfer/${data.item.hash}`" v-b-tooltip.hover class="fa-bounce tag">
              {{ shortHash(data.item.hash) }}
            </nuxt-link>
        </template>
        <template #cell(source)="data">
			<span icon="avatar">
				<Identicon
					:key="data.item.source"
					:address="data.item.source"
					/>
				<nuxt-link
				:to="localePath(`/account/${data.item.source}`)"
				:title="$t('pages.accounts.account_details')"
				>
					{{ shortAddress(data.item.source) }}
				</nuxt-link>
			</span>
        </template>
        <template #cell(destination)="data">
          <template v-if="isValidAddressPolkadotAddress(data.item.destination)">
			  <span icon="avatar">
				<Identicon
					:key="data.item.destination"
					:address="data.item.destination"
				/>
				<nuxt-link
					:to="localePath(`/account/${data.item.destination}`)"
					:title="$t('pages.accounts.account_details')"
				>
					{{ shortAddress(data.item.destination) }}
				</nuxt-link>
			  </span>
          </template>
          <template v-else>
              {{ shortAddress(data.item.destination || '') }}
          </template>
        </template>
        <template #cell(amount)="data">
            {{ formatAmount(data.item.amount) }}
        </template>
	</table-component>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'
import TableComponent from '@/components/more/TableComponent.vue'

export default {
  components: {
    Identicon, TableComponent
  },
  mixins: [commonMixin],
  data() {

	const THAT = this;
	
    return {
		options:
		{
			get title(){ return THAT.$t('components.last_transfers.title') },
			get tooltip(){ return THAT.$t('components.last_transfers.transfers_details') },
			link: '/transfers',
			variant: 'i-fourth',
		},
      transfers: [],
      fields: [
        {
          key: 'hash',
          get label(){ return THAT.$t('components.last_transfers.hash') },
          sortable: false,
		  variant: 'i-fourth',
		  class: 'important'
        },
        {
          key: 'source',
          get label(){ return THAT.$t('components.last_transfers.source') },
          sortable: false,
        },
        {
          key: 'destination',
          get label(){ return THAT.$t('components.last_transfers.destination') },
          sortable: false,
        },
        {
          key: 'amount',
          get label(){ return THAT.$t('components.last_transfers.amount') },
          sortable: false,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      transfers: {
        query: gql`
          subscription transfers {
            transfer(order_by: { block_number: desc }, limit: 10) {
              hash
              source
              destination
              amount
            }
          }
        `,
        result({ data }) {
          this.transfers = data.transfer
        },
      },
    },
  },
}
</script>

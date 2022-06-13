<template>
	<table-component :items="transfers" :fields="fields" :options="options">

		<template #cell(hash)="data">
            <nuxt-link :to="`/transfer/${data.item.hash}`" v-b-tooltip.hover class="fa-bounce tag">
              {{ shortHash(data.item.hash) }}
            </nuxt-link>
        </template>
        <template #cell(source)="data">
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
        </template>
        <template #cell(destination)="data">
          <template v-if="isValidAddressPolkadotAddress(data.item.destination)">
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
  computed:
  {
		options()
		{
			return {
				title: this.$t('components.last_transfers.title'),
				tooltip: this.$t('components.last_transfers.transfers_details'),
				link: this.localePath('/transfers'),
				variant: 'i-fourth',
			};
		},
		fields()
		{
			return [
				{
					key: 'hash',
					label: this.$t('components.last_transfers.hash'),
					sortable: false,
					variant: 'i-fourth',
					class: 'pkd-separate'
				},
				{
					key: 'source',
					label: this.$t('components.last_transfers.source'),
					sortable: false,
				},
				{
					key: 'destination',
					label: this.$t('components.last_transfers.destination'),
					sortable: false,
				},
				{
					key: 'amount',
					label: this.$t('components.last_transfers.amount'),
					sortable: false,
				},
		]
	  },
  },
  data() {
    return {
      transfers: [],
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

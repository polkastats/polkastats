<template>
	<table-component :items="transfers" :fields="fields" :options="options">

		<template #cell(hash)="data">
            <nuxt-link :to="`/transfer/${data.item.hash}`" v-b-tooltip.hover class="tag">
              {{ shortHash(data.item.hash) }}
            </nuxt-link>
        </template>
        <template #cell(source)="data">
            <nuxt-link
              :to="localePath(`/account/${data.item.source}`)"
              :title="$t('pages.accounts.account_details')"
			  icon="avatar"
            >
				<Identicon
				:key="data.item.source"
				:address="data.item.source"
				/>
              	{{ shortAddress(data.item.source) }}
            </nuxt-link>
        </template>
        <template #cell(destination)="data">
          <span v-if="isValidAddressPolkadotAddress(data.item.destination)" icon="avatar">
              <nuxt-link
                :to="localePath(`/account/${data.item.destination}`)"
                :title="$t('pages.accounts.account_details')"
              >
				<Identicon
					:key="data.item.destination"
					:address="data.item.destination"
				/>
                {{ shortAddress(data.item.destination) }}
              </nuxt-link>
          </span>
          <span v-else>
              {{ shortAddress(data.item.destination || '') }}
          </span>
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
    return {
		options:
		{
			title: this.$t('components.last_transfers.title'),
			tooltip: this.$t('components.last_transfers.transfers_details'),
			link: '/transfers',
			variant: 'i-fourth',
		},
      transfers: [],
      fields: [
        {
          key: 'hash',
          label: this.$t('components.last_transfers.hash'),
          sortable: false,
		  variant: 'i-fourth',
		  class: 'important'
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

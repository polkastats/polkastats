<template>
	<table-component :items="transfers" :fields="fields" :options="options">

		<template #cell(hash)="data">
            <nuxt-link :to="`/transfer/${data.item.hash}`" class="tag">
              {{ shortHash(data.item.hash) }}
            </nuxt-link>
        </template>
        <template #cell(source)="data">
            <nuxt-link
              :to="`/account/${data.item.source}`"
              :title="$t('pages.accounts.account_details')"
			  icon="avatar"
            >
              <Identicon
                :key="data.item.source"
                :address="data.item.source"
                :size="20"
              />
              {{ shortAddress(data.item.source) }}
            </nuxt-link>
        </template>
        <template #cell(destination)="data">
          <div v-if="isValidAddressPolkadotAddress(data.item.destination)" icon="avatar">
              <nuxt-link
                :to="`/account/${data.item.destination}`"
                :title="$t('pages.accounts.account_details')"
              >
                <Identicon
                  :key="data.item.destination"
                  :address="data.item.destination"
                  :size="20"
                />
                {{ shortAddress(data.item.destination) }}
              </nuxt-link>
          </div>
          <div v-else>
              {{ shortAddress(data.item.destination || '') }}
          </div>
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
import TableComponent from './more/TableComponent.vue'

export default {
  components: {
    Identicon, TableComponent
  },
  mixins: [commonMixin],
  data() {
    return {
		options:
		{
			title: 'Last transfers',
			link: '/transfers',
			color: 'fourth'
		},
      transfers: [],
      fields: [
        {
          key: 'hash',
          label: 'Hash',
          sortable: false,
        },
        {
          key: 'source',
          label: 'From',
          sortable: false,
        },
        {
          key: 'destination',
          label: 'To',
          sortable: false,
        },
        {
          key: 'amount',
          label: 'Amount',
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
            transfer(limit: 10) {
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

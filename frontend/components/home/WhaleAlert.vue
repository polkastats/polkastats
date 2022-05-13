<template>
	<table-component :items="transfers" :fields="fields" :options="options">
		<template #cell(hash)="data">
			<nuxt-link :to="localePath(`/transfer/${data.item.hash}`)">
				{{ shortHash(data.item.hash) }}
			</nuxt-link>
		</template>
		<template #cell(block_number)="data">
			<nuxt-link
			v-b-tooltip.hover
			:to="localePath(`/block?blockNumber=${data.item.block_number}`)"
			:title="$t('common.block_details')"
			>
				#{{ formatNumber(data.item.block_number) }}
			</nuxt-link>
		</template>
		<template #cell(timestamp)="data">
			{{ fromNow(data.item.timestamp) }}
		</template>
		<template #cell(source)="data">
			<span icon="avatar">
				<Identicon
				:key="data.item.source"
				:address="data.item.source"
				:size="20"
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
			<span v-if="isValidAddressPolkadotAddress(data.item.destination)" icon="avatar">
				<Identicon
					:key="data.item.destination"
					:address="data.item.destination"
					:size="20"
				/>
				<nuxt-link
					:to="localePath(`/account/${data.item.destination}`)"
					:title="$t('pages.accounts.account_details')"
				>
					{{ shortAddress(data.item.destination) }}
				</nuxt-link>
			</span>
			<template v-else>
				{{ shortAddress(data.item.destination || '') }}
			</template>
		</template>
		<template #cell(amount)="data">
			<b>
				{{ formatAmount(data.item.amount) }}
			</b>
			<FIATConversion
			:units="data.item.amount"
			:timestamp="data.item.timestamp"
			variant="i-third-25"
			class="mt-1"
			/>
		</template>
	</table-component>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'
import FIATConversion from '@/components/FIATConversion.vue'
import TableComponent from '@/components/more/TableComponent.vue'

export default {
  components: {
    Identicon,
    FIATConversion,
	TableComponent
  },
  mixins: [commonMixin],
  data() {

	const THAT = this;
	
    return {
		options:
		{
			get title(){ return THAT.$t('components.whale_alert.title') },
			get subtitle(){ return THAT.$t('components.whale_alert.description') },
			variant: 'i-secondary',
		},
      transfers: [],
      fields: [
        {
          key: 'hash',
          get label(){ return THAT.$t('components.whale_alert.hash') },
          sortable: false,
		  variant: 'i-fourth',
		  class: 'important'
        },
        {
          key: 'block_number',
          get label(){ return THAT.$t('components.whale_alert.block_number') },
          sortable: false,
		  class: 'highlighted'
        },
        {
          key: 'timestamp',
          get label(){ return THAT.$t('components.whale_alert.timestamp') },
          sortable: false,
        },
        {
          key: 'source',
          get label(){ return THAT.$t('components.whale_alert.source') },
          sortable: false,
        },
        {
          key: 'destination',
          get label(){ return THAT.$t('components.whale_alert.destination') },
          sortable: false,
        },
        {
          key: 'amount',
          get label(){ return THAT.$t('components.whale_alert.amount') },
          sortable: false,
		  tdClass: 'text-left'
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      transfers: {
        query: gql`
          subscription whale_alert {
            whale_alert(
              order_by: { amount: desc, block_number: desc }
              limit: 10
            ) {
              block_number
              hash
              source
              destination
              amount
              timestamp
            }
          }
        `,
        result({ data }) {
          this.transfers = data.whale_alert
        },
      },
    },
  },
}
</script>

<template>
  <div class="whale-alert">
    <h3>
      <nuxt-link
        v-b-tooltip.hover
        :to="localePath(`/transfers`)"
        :title="$t('components.whale_alert.transfers_details')"
      >
        {{ $t('components.whale_alert.title') }}
      </nuxt-link>
    </h3>
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="transfers">
        <template #cell(hash)="data">
          <p class="mb-0">
            <nuxt-link :to="localePath(`/transfer/${data.item.hash}`)">
              {{ shortHash(data.item.hash) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(source)="data">
          <p class="mb-0">
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
          </p>
        </template>
        <template #cell(destination)="data">
          <div v-if="isValidAddressPolkadotAddress(data.item.destination)">
            <p class="mb-0">
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
            </p>
          </div>
          <div v-else>
            <p class="mb-0">
              {{ shortAddress(data.item.destination || '') }}
            </p>
          </div>
        </template>
        <template #cell(amount)="data">
          <p class="mb-0">
            {{ formatAmount(data.item.amount) }}
          </p>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'

export default {
  components: {
    Identicon,
  },
  mixins: [commonMixin],
  data() {
    return {
      transfers: [],
      fields: [
        {
          key: 'hash',
          label: this.$t('components.whale_alert.hash'),
          sortable: false,
        },
        {
          key: 'source',
          label: this.$t('components.whale_alert.source'),
          sortable: false,
        },
        {
          key: 'destination',
          label: this.$t('components.whale_alert.destination'),
          sortable: false,
        },
        {
          key: 'amount',
          label: this.$t('components.whale_alert.amount'),
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
            transfer(
              order_by: { amount: desc, block_number: desc }
              where: { success: { _eq: true } }
              limit: 10
            ) {
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

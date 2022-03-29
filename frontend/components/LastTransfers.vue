<template>
  <div class="last-transfers">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="transfers">
        <template #cell(hash)="data">
          <p class="mb-0">
            <nuxt-link :to="`/transfer/${data.item.hash}`">
              {{ shortHash(data.item.hash) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(source)="data">
          <p class="mb-0">
            <nuxt-link
              :to="`/account/${data.item.source}`"
              :title="$t('pages.accounts.account_details')"
            >
              <Identicon
                :key="data.item.source"
                :address="data.item.source"
                :size="20"
              />
              {{ shortAddress(data.item.source) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(destination)="data">
          <div v-if="isValidAddressPolkadotAddress(data.item.destination)">
            <p class="mb-0">
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

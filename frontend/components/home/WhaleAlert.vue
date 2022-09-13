<template>
  <div class="whale-alert">
    <h3 class="text-primary2">
      {{ $t('components.whale_alert.title') }}
    </h3>
    <p>{{ $t('components.whale_alert.description') }}</p>
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="transfers">
        <template #cell(hash)="data">
          <p class="mb-0">
            <nuxt-link :to="localePath(`/transfer/${data.item.hash}`)">
              {{ shortHash(data.item.hash) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              v-b-tooltip.hover
              :to="localePath(`/block?blockNumber=${data.item.block_number}`)"
              :title="$t('common.block_details')"
            >
              #{{ formatNumber(data.item.block_number) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(timestamp)="data">
          <p class="mb-0">
            {{ fromNow(data.item.timestamp) }}
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
            <FIATConversion
              :units="data.item.amount.toString()"
              :timestamp="data.item.timestamp"
            />
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
import FIATConversion from '@/components/FIATConversion.vue'

export default {
  components: {
    Identicon,
    FIATConversion,
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
          key: 'block_number',
          label: this.$t('components.whale_alert.block_number'),
          sortable: false,
        },
        {
          key: 'timestamp',
          label: this.$t('components.whale_alert.timestamp'),
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

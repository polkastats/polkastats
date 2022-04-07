<template>
  <div class="transfers">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else>
      <div class="table-responsive">
        <b-table striped hover :fields="fields" :items="transfers">
          <template #cell(hash)="data">
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="`/transfer/${data.item.hash}`"
                :title="$t('components.account_transfers.transfer_details')"
              >
                {{ shortHash(data.item.hash) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(block_number)="data">
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="`/block?blockNumber=${data.item.block_number}`"
                :title="$t('components.account_transfers.block_details')"
              >
                #{{ formatNumber(data.item.block_number) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(source)="data">
            <p class="mb-0">
              <nuxt-link
                :to="`/account/${data.item.source}`"
                :title="$t('pages.accounts.account_details')"
              >
                <Identicon :address="data.item.source" :size="20" />
                {{ shortAddress(data.item.source) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(timestamp)="data">
            <p class="mb-0">
              {{ getDateFromTimestamp(data.item.timestamp) }}
            </p>
          </template>
          <template #cell(destination)="data">
            <p class="mb-0">
              <nuxt-link
                :to="`/account/${data.item.destination}`"
                :title="$t('pages.accounts.account_details')"
              >
                <Identicon :address="data.item.destination" :size="20" />
                {{ shortAddress(data.item.destination) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(amount)="data">
            <p class="mb-0">
              {{ formatAmount(data.item.amount) }}
            </p>
          </template>
          <template #cell(success)="data">
            <p class="mb-0">
              <font-awesome-icon
                v-if="data.item.success"
                icon="check"
                class="text-success"
              />
              <font-awesome-icon v-else icon="times" class="text-danger" />
            </p>
          </template>
        </b-table>
        <div class="mt-4 d-flex">
          <b-pagination
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
            aria-controls="my-table"
            variant="dark"
            align="right"
          ></b-pagination>
          <b-button-group class="ml-2">
            <b-button
              v-for="(item, index) in tableOptions"
              :key="index"
              variant="primary2"
              @click="setPageSize(item)"
            >
              {{ item }}
            </b-button>
          </b-button-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Identicon,
    Loading,
  },
  mixins: [commonMixin],
  props: {
    accountId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      transfers: [],
      tableOptions: paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'hash',
          label: this.$t('components.account_transfers.hash'),
          class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
          sortable: false,
        },
        {
          key: 'block_number',
          label: this.$t('components.account_transfers.block_number'),
          class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
          sortable: false,
        },
        {
          key: 'timestamp',
          label: this.$t('components.account_transfers.timestamp'),
          sortable: false,
        },
        {
          key: 'source',
          label: this.$t('components.account_transfers.source'),
          sortable: false,
        },
        {
          key: 'destination',
          label: this.$t('components.account_transfers.destination'),
          sortable: false,
        },
        {
          key: 'amount',
          label: this.$t('components.account_transfers.amount'),
          sortable: false,
        },
        {
          key: 'success',
          label: this.$t('components.account_transfers.success'),
          sortable: false,
        },
      ],
    }
  },
  methods: {
    setPageSize(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
  apollo: {
    $subscribe: {
      transfer: {
        query: gql`
          subscription transfer(
            $accountId: String!
            $perPage: Int!
            $offset: Int!
          ) {
            transfer(
              order_by: { block_number: desc }
              where: {
                _or: [
                  { source: { _eq: $accountId } }
                  { destination: { _eq: $accountId } }
                ]
              }
              limit: $perPage
              offset: $offset
            ) {
              block_number
              extrinsic_index
              section
              method
              hash
              source
              destination
              amount
              fee_amount
              success
              timestamp
            }
          }
        `,
        variables() {
          return {
            accountId: this.accountId,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.transfers = data.transfer
          this.loading = false
        },
      },
      count: {
        query: gql`
          subscription count($accountId: String!) {
            transfer_aggregate(
              where: {
                _or: [
                  { source: { _eq: $accountId } }
                  { destination: { _eq: $accountId } }
                ]
              }
            ) {
              aggregate {
                count
              }
            }
          }
        `,
        variables() {
          return {
            accountId: this.accountId,
          }
        },
        result({ data }) {
          this.totalRows = data.transfer_aggregate.aggregate.count
          this.$emit('totalTransfers', this.totalRows)
        },
      },
    },
  },
}
</script>

<style>
.sent-transfers {
  background-color: white;
}
</style>

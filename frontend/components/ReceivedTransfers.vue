<template>
  <div class="received-transfers">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="transfers.length === 0" class="text-center py-4">
      <h5>{{ $t('components.transfers.no_transfer_found') }}</h5>
    </div>
    <div v-else>
      <!-- Filter -->
      <b-row style="margin-bottom: 1rem">
        <b-col cols="12">
          <b-form-input
            id="filterInput"
            v-model="filter"
            type="search"
            :placeholder="$t('components.transfers.search')"
          />
        </b-col>
      </b-row>
      <JsonCSV
        :data="transfers"
        class="download-csv mb-2"
        :name="`polkastats_received_transfers_${accountId}.csv`"
      >
        <font-awesome-icon icon="file-csv" />
        {{ $t('pages.accounts.download_csv') }}
      </JsonCSV>
      <div class="table-responsive">
        <b-table
          striped
          hover
          :fields="fields"
          :per-page="perPage"
          :current-page="currentPage"
          :items="transfers"
          :filter="filter"
          @filtered="onFiltered"
        >
          <template #cell(block_number)="data">
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="`/block?blockNumber=${data.item.block_number}`"
                title="Check block information"
              >
                #{{ formatNumber(data.item.block_number) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(from)="data">
            <p class="mb-0">
              <nuxt-link
                :to="`/account/${data.item.from}`"
                :title="$t('pages.accounts.account_details')"
              >
                <Identicon :address="data.item.from" :size="20" />
                {{ shortAddress(data.item.from) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(to)="data">
            <p class="mb-0">
              <nuxt-link
                :to="`/account/${data.item.to}`"
                :title="$t('pages.accounts.account_details')"
              >
                <Identicon :address="data.item.to" :size="20" />
                {{ shortAddress(data.item.to) }}
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
            aria-controls="validators-table"
          />
          <b-button-group class="ml-2">
            <b-button
              v-for="(item, index) in tableOptions"
              :key="index"
              variant="primary2"
              @click="handleNumFields(item)"
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
import JsonCSV from 'vue-json-csv'
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Identicon,
    JsonCSV,
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
      filter: null,
      filterOn: [],
      tableOptions: paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'block_number',
          label: 'Block number',
          class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
          sortable: true,
        },
        // {
        //   key: 'hash',
        //   label: 'Hash',
        //   class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
        //   sortable: true,
        // },
        {
          key: 'from',
          label: 'From',
          sortable: true,
        },
        {
          key: 'to',
          label: 'To',
          sortable: true,
        },
        {
          key: 'amount',
          label: 'Amount',
          sortable: true,
        },
        {
          key: 'success',
          label: 'Success',
          sortable: true,
        },
      ],
    }
  },
  methods: {
    handleNumFields(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length
      this.currentPage = 1
    },
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription event($accountId: String!) {
            event(
              order_by: { block_number: desc }
              where: {
                section: { _eq: "balances" }
                method: { _eq: "Transfer" }
                data: { _like: $accountId }
              }
            ) {
              block_number
              data
            }
          }
        `,
        variables() {
          return {
            accountId: `%,"${this.accountId}",%`,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.transfers = data.event.map((event) => {
            return {
              block_number: event.block_number,
              from: JSON.parse(event.data)[0],
              to: this.accountId,
              amount: JSON.parse(event.data)[2],
              success: true,
            }
          })
          this.totalRows = this.transfers.length
          this.loading = false
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

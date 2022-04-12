<template>
  <div>
    <section>
      <b-container class="main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>
              {{ $t('pages.transfers.title') }}
              <small v-if="totalRows !== 1" class="ml-1" style="font-size: 1rem"
                >[{{ formatNumber(totalRows) }}]</small
              >
            </h1>
          </b-col>
        </b-row>
        <div class="last-transfers">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <template v-else>
            <!-- Filter -->
            <b-row style="margin-bottom: 1rem">
              <b-col cols="12">
                <b-input-group size="xl" class="mb-2">
                  <b-input-group-prepend is-text>
                    <font-awesome-icon icon="search" />
                  </b-input-group-prepend>
                  <b-form-input
                    id="filterInput"
                    v-model="filter"
                    type="search"
                    :placeholder="$t('pages.transfers.search_placeholder')"
                  />
                </b-input-group>
              </b-col>
            </b-row>
            <div class="table-responsive">
              <b-table striped hover :fields="fields" :items="transfers">
                <template #cell(block_number)="data">
                  <p class="mb-0">
                    <nuxt-link
                      v-b-tooltip.hover
                      :to="
                        localePath(
                          `/block?blockNumber=${data.item.block_number}`
                        )
                      "
                      :title="$t('common.block_details')"
                    >
                      #{{ formatNumber(data.item.block_number) }}
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(hash)="data">
                  <p class="mb-0">
                    <nuxt-link :to="localePath(`/transfer/${data.item.hash}`)">
                      {{ shortHash(data.item.hash) }}
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
                    <Identicon :address="data.item.source" :size="20" />
                    <nuxt-link
                      v-b-tooltip.hover
                      :to="localePath(`/account/${data.item.source}`)"
                      :title="$t('pages.accounts.account_details')"
                    >
                      {{ shortAddress(data.item.source) }}
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(destination)="data">
                  <p class="mb-0">
                    <Identicon :address="data.item.destination" :size="20" />
                    <nuxt-link
                      v-b-tooltip.hover
                      :to="localePath(`/account/${data.item.destination}`)"
                      :title="$t('pages.accounts.account_details')"
                    >
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
                    <font-awesome-icon
                      v-else
                      icon="times"
                      class="text-danger"
                    />
                  </p>
                </template>
              </b-table>
            </div>
            <!-- pagination -->
            <div class="row">
              <div class="col-6">
                <!-- desktop -->
                <div class="d-none d-sm-none d-md-none d-lg-block d-xl-block">
                  <b-button-group>
                    <b-button
                      v-for="(option, index) in paginationOptions"
                      :key="index"
                      variant="outline-primary2"
                      :class="{ 'selected-per-page': perPage === option }"
                      @click="setPageSize(option)"
                    >
                      {{ option }}
                    </b-button>
                  </b-button-group>
                </div>
                <!-- mobile -->
                <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
                  <b-dropdown
                    class="m-md-2"
                    text="Page size"
                    variant="outline-primary2"
                  >
                    <b-dropdown-item
                      v-for="(option, index) in paginationOptions"
                      :key="index"
                      @click="setPageSize(option)"
                    >
                      {{ option }}
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
              </div>
              <div class="col-6">
                <b-pagination
                  v-model="currentPage"
                  :total-rows="totalRows"
                  :per-page="perPage"
                  aria-controls="my-table"
                  variant="dark"
                  align="right"
                ></b-pagination>
              </div>
            </div>
          </template>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import Identicon from '@/components/Identicon.vue'
import { config, paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Identicon,
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: null,
      transfers: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'hash',
          label: this.$t('pages.transfers.hash'),
          sortable: false,
        },
        {
          key: 'block_number',
          label: this.$t('pages.transfers.block_number'),
          sortable: false,
        },
        {
          key: 'timestamp',
          label: this.$t('pages.transfers.timestamp'),
          sortable: false,
        },
        {
          key: 'source',
          label: this.$t('pages.transfers.source'),
          sortable: false,
        },
        {
          key: 'destination',
          label: this.$t('pages.transfers.destination'),
          sortable: false,
        },
        {
          key: 'amount',
          label: this.$t('pages.transfers.amount'),
          sortable: false,
        },
        {
          key: 'success',
          label: this.$t('pages.transfers.success'),
          sortable: false,
        },
      ],
    }
  },
  head() {
    return {
      title: this.$t('pages.transfers.head_title', {
        networkName: config.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.transfers.head_content', {
            networkName: config.name,
          }),
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
      transfers: {
        query: gql`
          subscription transfers(
            $blockNumber: bigint
            $hash: String
            $source: String
            $destination: String
            $perPage: Int!
            $offset: Int!
          ) {
            transfer(
              limit: $perPage
              offset: $offset
              where: {
                _or: [
                  { block_number: { _eq: $blockNumber } }
                  { hash: { _eq: $hash } }
                  { source: { _eq: $source } }
                  { destination: { _eq: $destination } }
                ]
              }
              order_by: { block_number: desc, extrinsic_index: desc }
            ) {
              block_number
              hash
              source
              destination
              amount
              success
              timestamp
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.isBlockNumber(this.filter)
              ? parseInt(this.filter)
              : -1,
            hash: this.filter,
            source: this.filter,
            destination: this.filter,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.transfers = data.transfer
          this.loading = false
        },
      },
      count: {
        query: gql`
          subscription count(
            $blockNumber: bigint
            $hash: String
            $source: String
            $destination: String
          ) {
            transfer_aggregate(
              where: {
                _or: [
                  { block_number: { _eq: $blockNumber } }
                  { hash: { _eq: $hash } }
                  { source: { _eq: $source } }
                  { destination: { _eq: $destination } }
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
            blockNumber: this.isBlockNumber(this.filter)
              ? parseInt(this.filter)
              : -1,
            hash: this.filter,
            source: this.filter,
            destination: this.filter,
          }
        },
        result({ data }) {
          this.totalRows = data.transfer_aggregate.aggregate.count
        },
      },
    },
  },
}
</script>

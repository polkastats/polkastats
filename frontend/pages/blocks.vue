<template>
  <div>
    <section>
      <b-container class="main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>
              {{ $t('pages.blocks.title') }}
              <small v-if="totalRows !== 1" class="ml-1" style="font-size: 1rem"
                >[{{ formatNumber(totalRows) }}]</small
              >
            </h1>
          </b-col>
        </b-row>
        <div class="last-blocks">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <template v-else>
            <!-- Filter -->
            <b-row style="margin-bottom: 1rem">
              <b-col cols="12">
                <b-form-input
                  id="filterInput"
                  v-model="filter"
                  type="search"
                  :placeholder="$t('pages.blocks.search_placeholder')"
                />
              </b-col>
            </b-row>
            <div class="table-responsive">
              <b-table striped hover :fields="fields" :items="blocks">
                <template #cell(block_number)="data">
                  <p class="mb-0">
                    <nuxt-link
                      v-b-tooltip.hover.bottom
                      :to="`/block?blockNumber=${data.item.block_number}`"
                      title="Check block information"
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
                <template #cell(block_author)="data">
                  <p class="mb-0">
                    <Identicon :address="data.item.block_author" :size="22" />
                    <nuxt-link :to="`/validator/${data.item.block_author}`">
                      <span v-if="data.item.block_author_name">{{
                        data.item.block_author_name
                      }}</span>
                      <span v-else>{{
                        shortAddress(data.item.block_author)
                      }}</span>
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(finalized)="data">
                  <p v-if="data.item.finalized" class="mb-0">
                    <font-awesome-icon icon="check" class="text-success" />
                  </p>
                  <p v-else class="mb-0">
                    <font-awesome-icon icon="clock" class="text-light" />
                  </p>
                </template>
                <template #cell(block_hash)="data">
                  <p class="mb-0">
                    {{ shortHash(data.item.block_hash) }}
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
                      @click="setPageSize(10)"
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
import { network, paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: '',
      blocks: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'block_number',
          label: 'Block',
          sortable: true,
        },
        {
          key: 'timestamp',
          label: 'Date',
          sortable: true,
        },
        {
          key: 'finalized',
          label: 'Finalized',
          sortable: true,
        },
        {
          key: 'block_author',
          label: 'Author',
          sortable: true,
        },
        {
          key: 'block_hash',
          label: 'Hash',
          sortable: true,
        },
        {
          key: 'total_extrinsics',
          label: 'Extrinsics',
          sortable: true,
        },
        {
          key: 'total_events',
          label: 'Events',
          sortable: true,
        },
      ],
    }
  },
  head() {
    return {
      title: this.$t('pages.blocks.head_title', {
        networkName: network.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.blocks.head_content', {
            networkName: network.name,
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
      block: {
        query: gql`
          subscription blocks(
            $blockNumber: bigint
            $blockHash: String
            $perPage: Int!
            $offset: Int!
          ) {
            block(
              limit: $perPage
              offset: $offset
              where: {
                block_number: { _eq: $blockNumber }
                block_hash: { _eq: $blockHash }
              }
              order_by: { block_number: desc }
            ) {
              block_number
              block_author
              block_author_name
              finalized
              block_hash
              total_extrinsics
              total_events
              timestamp
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.isBlockNumber(this.filter)
              ? parseInt(this.filter)
              : undefined,
            blockHash: this.isHash(this.filter) ? this.filter : undefined,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.blocks = data.block
          if (this.filter) {
            this.totalRows = this.blocks.length
          }
          this.loading = false
        },
      },
      totalBlocks: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "blocks" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          if (!this.filter) {
            this.totalRows = data.total[0].count
          }
        },
      },
    },
  },
}
</script>

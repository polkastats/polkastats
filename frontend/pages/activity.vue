<template>
  <div>
    <section>
      <b-container class="main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>
              {{ $t('pages.activity.title') }}
              <small v-if="totalRows !== 1" class="ml-1" style="font-size: 1rem"
                >[{{ formatNumber(totalRows) }}]</small
              >
            </h1>
          </b-col>
        </b-row>
        <div class="last-extrinsics">
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
                  :placeholder="$t('pages.activity.search_placeholder')"
                />
              </b-col>
            </b-row>
            <div class="table-responsive">
              <b-table striped hover :fields="fields" :items="extrinsics">
                <template #cell(block_number)="data">
                  <p class="mb-0">
                    <nuxt-link
                      v-b-tooltip.hover
                      :to="`/extrinsic/${data.item.block_number}/${data.item.extrinsic_index}`"
                      title="Check extrinsic information"
                    >
                      {{ data.item.block_number }}-{{
                        data.item.extrinsic_index
                      }}
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(signer)="data">
                  <p class="mb-0">
                    <Identicon :address="data.item.signer" :size="20" />
                    <nuxt-link
                      v-b-tooltip.hover
                      :to="`/account/${data.item.signer}`"
                      :title="$t('pages.accounts.account_details')"
                    >
                      {{ shortAddress(data.item.signer) }}
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(hash)="data">
                  <p class="mb-0">{{ shortHash(data.item.hash) }}</p>
                </template>
                <template #cell(section)="data">
                  <p class="mb-0">
                    {{ data.item.section }} ➡
                    {{ data.item.method }}
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
                      variant="outline-secondary"
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
                    variant="outline-secondary"
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
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: null,
      extrinsics: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'block_number',
          label: 'Extrinsic',
          sortable: true,
        },
        {
          key: 'signer',
          label: 'Signer',
          sortable: true,
        },
        {
          key: 'hash',
          label: 'Hash',
          sortable: true,
        },
        {
          key: 'section',
          label: 'Extrinsic',
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
    setPageSize(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics(
            $blockNumber: bigint
            $extrinsicHash: String
            $signer: String
            $perPage: Int!
            $offset: Int!
          ) {
            extrinsic(
              limit: $perPage
              offset: $offset
              where: {
                block_number: { _eq: $blockNumber }
                hash: { _eq: $extrinsicHash }
                is_signed: { _eq: true }
                signer: { _eq: $signer }
              }
              order_by: { block_number: desc, extrinsic_index: desc }
            ) {
              block_number
              extrinsic_index
              is_signed
              signer
              section
              method
              hash
              success
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.isBlockNumber(this.filter)
              ? parseInt(this.filter)
              : undefined,
            extrinsicHash: this.isHash(this.filter) ? this.filter : undefined,
            signer: this.isAddress(this.filter) ? this.filter : undefined,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.extrinsics = data.extrinsic
          this.loading = false
        },
      },
      count: {
        query: gql`
          subscription count(
            $blockNumber: bigint
            $extrinsicHash: String
            $signer: String
          ) {
            extrinsic_aggregate(
              where: {
                block_number: { _eq: $blockNumber }
                hash: { _eq: $extrinsicHash }
                is_signed: { _eq: true }
                signer: { _eq: $signer }
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
            blockNumber: this.filter ? parseInt(this.filter) : undefined,
            extrinsicHash: this.isHash(this.filter) ? this.filter : undefined,
            signer: this.isAddress(this.filter) ? this.filter : undefined,
          }
        },
        result({ data }) {
          this.totalRows = data.extrinsic_aggregate.aggregate.count
        },
      },
    },
  },
}
</script>

<style>
.last-blocks .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>

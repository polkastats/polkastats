<template>
  <div class="sent-transfers">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="extrinsics.length === 0" class="text-center py-4">
      <h5>{{ $t('components.transfers.no_transfer_found') }}</h5>
    </div>
    <div v-else>
      <div class="table-responsive">
        <b-table striped hover :fields="fields" :items="extrinsics">
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
          <template #cell(hash)="data">
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="`/extrinsic/${data.item.hash}`"
                title="Check extrinsic information"
              >
                {{ shortHash(data.item.hash) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(timestamp)="data">
            <p class="mb-0">
              {{ getDateFromTimestamp(data.item.timestamp) }}
            </p>
          </template>
          <template #cell(signer)="data">
            <p class="mb-0">
              <nuxt-link
                :to="`/account/${data.item.signer}`"
                :title="$t('pages.accounts.account_details')"
              >
                <Identicon :address="data.item.signer" :size="20" />
                {{ shortAddress(data.item.signer) }}
              </nuxt-link>
            </p>
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
      extrinsics: [],
      tableOptions: paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'hash',
          label: 'Hash',
          sortable: false,
        },
        {
          key: 'block_number',
          label: 'Block',
          class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
          sortable: false,
        },
        {
          key: 'timestamp',
          label: 'Date',
          sortable: false,
        },
        {
          key: 'signer',
          label: 'Signer',
          sortable: false,
        },
        {
          key: 'section',
          label: 'Extrinsic',
          sortable: false,
        },
        {
          key: 'success',
          label: 'Success',
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
      extrinsic: {
        query: gql`
          subscription extrinsic(
            $signer: String!
            $perPage: Int!
            $offset: Int!
          ) {
            signed_extrinsic(
              order_by: { block_number: desc }
              where: { signer: { _eq: $signer } }
              limit: $perPage
              offset: $offset
            ) {
              block_number
              signer
              hash
              section
              method
              success
              timestamp
            }
          }
        `,
        variables() {
          return {
            signer: this.accountId,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.extrinsics = data.signed_extrinsic
          this.loading = false
        },
      },
      count: {
        query: gql`
          subscription extrinsic($signer: String!) {
            signed_extrinsic_aggregate(where: { signer: { _eq: $signer } }) {
              aggregate {
                count
              }
            }
          }
        `,
        variables() {
          return {
            signer: this.accountId,
          }
        },
        result({ data }) {
          this.totalRows = data.signed_extrinsic_aggregate.aggregate.count
          this.$emit('totalExtrinsics', this.totalRows)
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
.spinner {
  color: #d3d2d2;
}
</style>

<template>
  <div v-if="blockExtrinsics.length > 0">
    <div class="table-responsive">
      <b-table
        striped
        hover
        :fields="fields"
        :per-page="perPage"
        :current-page="currentPage"
        :items="blockExtrinsics"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
      >
        <template #cell(extrinsic_index)="data">
          <p class="mb-0">
            <nuxt-link
              v-b-tooltip.hover
              :to="
                localePath(
                  `/extrinsic/${data.item.block_number}/${data.item.extrinsic_index}`
                )
              "
              :title="$t('components_block_extrinsics.extrinsic_details')"
            >
              #{{ formatNumber(data.item.block_number) }}-{{
                data.item.extrinsic_index
              }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(hash)="data">
          {{ shortHash(data.item.hash) }}
        </template>
        <template #cell(signer)="data">
          <span v-if="data.item.signer">
            <Identicon :address="data.item.signer" :size="20" />
            <nuxt-link
              v-b-tooltip.hover
              :to="localePath(`/account/${data.item.signer}`)"
              :title="$t('details.block.account_details')"
            >
              {{ shortAddress(data.item.signer) }}
            </nuxt-link>
          </span>
        </template>
        <template #cell(success)="data">
          <font-awesome-icon
            v-if="data.item.success"
            icon="check"
            class="text-success"
          />
          <font-awesome-icon v-else icon="times" class="text-danger" />
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
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import { paginationOptions } from '@/frontend.config.js'

export default {
  mixins: [commonMixin],
  props: {
    blockNumber: {
      type: String,
      default: () => '',
    },
  },
  data() {
    return {
      loading: true,
      blockExtrinsics: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      sortBy: 'extrinsic_index',
      sortDesc: false,
      fields: [
        {
          key: 'extrinsic_index',
          label: 'ID',
          sortable: true,
        },
        {
          key: 'hash',
          label: this.$t('details.block.hash'),
          sortable: true,
        },
        {
          key: 'signer',
          label: this.$t('details.block.signer'),
          sortable: true,
        },
        {
          key: 'section',
          label: this.$t('details.block.section'),
          sortable: true,
        },
        {
          key: 'method',
          label: this.$t('details.block.method'),
          sortable: true,
        },
        {
          key: 'success',
          label: this.$t('details.block.success'),
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
          subscription extrinsic($block_number: bigint!) {
            extrinsic(where: { block_number: { _eq: $block_number } }) {
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
            block_number: this.blockNumber,
          }
        },
        result({ data }) {
          this.blockExtrinsics = data.extrinsic
          this.totalRows = this.blockExtrinsics.length
          this.$emit('totalExtrinsics', this.blockExtrinsics.length)
        },
      },
    },
  },
}
</script>
<style scoped>
td {
  word-break: break-all;
}
td:first-child {
  width: 12%;
}
</style>

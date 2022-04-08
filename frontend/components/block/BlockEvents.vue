<template>
  <div v-if="blockEvents.length > 0">
    <div class="table-responsive">
      <b-table
        striped
        hover
        :fields="fields"
        :per-page="perPage"
        :current-page="currentPage"
        :items="blockEvents"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
      >
        <template #cell(event_index)="data">
          <p class="mb-0">
            <nuxt-link
              v-b-tooltip.hover
              :to="
                localePath(
                  `/event/${data.item.block_number}/${data.item.event_index}`
                )
              "
              :title="$t('components_block_events.event_details')"
            >
              #{{ formatNumber(data.item.block_number) }}-{{
                data.item.event_index
              }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(data)="data">
          <template
            v-if="
              data.item.section === `balances` &&
              data.item.method === `Transfer`
            "
          >
            <Identicon :address="JSON.parse(data.item.data)[0]" :size="20" />
            <nuxt-link
              v-b-tooltip.hover
              :to="localePath(`/account/${JSON.parse(data.item.data)[0]}`)"
              :title="$t('details.block.account_details')"
            >
              {{ shortAddress(JSON.parse(data.item.data)[0]) }}
            </nuxt-link>
            <font-awesome-icon icon="arrow-right" />
            <Identicon :address="JSON.parse(data.item.data)[1]" :size="20" />
            <nuxt-link
              v-b-tooltip.hover
              :to="localePath(`/account/${JSON.parse(data.item.data)[1]}`)"
              :title="$t('details.block.account_details')"
            >
              {{ shortAddress(JSON.parse(data.item.data)[1]) }}
            </nuxt-link>
            <font-awesome-icon icon="arrow-right" />
            <span class="amount">
              {{ formatAmount(JSON.parse(data.item.data)[2]) }}
            </span>
          </template>
          <template v-else>
            {{ data.item.data.substring(0, 32)
            }}{{ data.item.data.length > 32 ? '...' : '' }}</template
          >
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
      blockEvents: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      sortBy: 'event_index',
      sortDesc: false,
      fields: [
        {
          key: 'event_index',
          label: this.$t('details.block.event'),
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
          key: 'phase',
          label: this.$t('details.block.phase'),
          sortable: true,
        },
        {
          key: 'data',
          label: this.$t('details.block.data'),
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
      event: {
        query: gql`
          subscription event($block_number: bigint!) {
            event(where: { block_number: { _eq: $block_number } }) {
              block_number
              data
              event_index
              method
              phase
              section
            }
          }
        `,
        variables() {
          return {
            block_number: this.blockNumber,
          }
        },
        result({ data }) {
          this.blockEvents = data.event
          this.totalRows = this.blockEvents.length
          this.$emit('totalEvents', this.blockEvents.length)
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

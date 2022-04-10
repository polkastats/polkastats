<template>
  <div class="extrinsic-events">
    <h4 class="my-4 text-center">
      {{ $t('components.extrinsic_events.title') }}
    </h4>
    <div class="table-responsive">
      <b-table
        striped
        hover
        :fields="fields"
        :items="events"
        :per-page="perPage"
        :current-page="currentPage"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
      >
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              :to="
                localePath(
                  `/event/${data.item.block_number}/${data.item.event_index}`
                )
              "
            >
              #{{ formatNumber(data.item.block_number) }}-{{
                data.item.event_index
              }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(section)="data">
          <p class="mb-0">
            {{ data.item.section }} ➡
            {{ data.item.method }}
          </p>
        </template>
        <template #cell(data)="data">
          <p class="mb-0">
            {{ data.item.data.substring(0, 64)
            }}{{ data.item.data.length > 64 ? '...' : '' }}
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
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import { paginationOptions } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  props: {
    blockNumber: {
      type: Number,
      default: () => 0,
    },
    extrinsicIndex: {
      type: Number,
      default: () => 0,
    },
  },
  data() {
    return {
      events: [],
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
          key: 'block_number',
          label: this.$t('components.extrinsic_events.id'),
          sortable: true,
        },
        {
          key: 'section',
          label: this.$t('components.extrinsic_events.section'),
          sortable: true,
        },
        {
          key: 'data',
          label: this.$t('components.extrinsic_events.data'),
          sortable: true,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      event: {
        query: gql`
          subscription events($block_number: bigint!, $phase: String!) {
            event(
              order_by: { block_number: desc }
              where: {
                block_number: { _eq: $block_number }
                phase: { _eq: $phase }
              }
            ) {
              block_number
              event_index
              data
              method
              phase
              section
            }
          }
        `,
        variables() {
          return {
            block_number: parseInt(this.blockNumber),
            phase: `{"applyExtrinsic":${this.extrinsicIndex}}`,
          }
        },
        result({ data }) {
          this.events = data.event
          this.totalRows = this.events.length
        },
      },
    },
  },
  methods: {
    setPageSize(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
}
</script>

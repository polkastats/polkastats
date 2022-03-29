<template>
  <div class="extrinsic-events">
    <h4 class="my-4">Triggered events</h4>
    <div class="table-responsive">
      <b-table
        striped
        hover
        :fields="fields"
        :items="events"
        :per-page="perPage"
        :current-page="currentPage"
      >
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              :to="`/event/${data.item.block_number}/${data.item.event_index}`"
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
  data: () => {
    return {
      events: [],
      tableOptions: paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'block_number',
          label: 'Id',
          sortable: true,
        },
        {
          key: 'section',
          label: 'Event',
          sortable: true,
        },
        {
          key: 'section',
          label: 'Event',
          sortable: true,
        },
        {
          key: 'data',
          label: 'Data',
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

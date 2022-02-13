<template>
  <div class="last-blocks">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="blocks">
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
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import { gql } from 'graphql-tag'

export default {
  mixins: [commonMixin],
  data: () => {
    return {
      blocks: [],
      fields: [
        {
          key: 'block_number',
          label: 'Block',
          sortable: true,
        },
        {
          key: 'finalized',
          label: 'Finalized',
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
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks {
            block(order_by: { block_number: desc }, where: {}, limit: 10) {
              block_number
              finalized
              block_hash
              total_extrinsics
              total_events
            }
          }
        `,
        result({ data }) {
          this.blocks = data.block
        },
      },
    },
  },
}
</script>

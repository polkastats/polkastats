<template>
  <div class="last-blocks">
    <h3>
      <nuxt-link
        v-b-tooltip.hover
        :to="localePath(`/blocks`)"
        :title="$t('components.last_blocks.blocks_details')"
      >
        {{ $t('components.last_blocks.title') }}
      </nuxt-link>
    </h3>
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="blocks">
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              v-b-tooltip.hover
              :to="localePath(`/block?blockNumber=${data.item.block_number}`)"
              :title="$t('components.last_blocks.block_details')"
            >
              #{{ formatNumber(data.item.block_number) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(finalized)="data">
          <p v-if="data.item.finalized" class="mb-0">
            <font-awesome-icon icon="check" class="text-success" />
            {{ $t('components.last_blocks.finalized') }}
          </p>
          <p v-else class="mb-0">
            <font-awesome-icon icon="spinner" class="text-light" spin />
            {{ $t('components.last_blocks.processing') }}
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
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      blocks: [],
      fields: [
        {
          key: 'block_number',
          label: this.$t('components.last_blocks.block_number'),
          sortable: false,
        },
        {
          key: 'finalized',
          label: this.$t('components.last_blocks.status'),
          sortable: false,
        },
        {
          key: 'block_hash',
          label: this.$t('components.last_blocks.hash'),
          sortable: false,
        },
        {
          key: 'total_extrinsics',
          label: this.$t('components.last_blocks.total_extrinsics'),
          sortable: false,
        },
        {
          key: 'total_events',
          label: this.$t('components.last_blocks.total_events'),
          sortable: false,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks {
            block(order_by: { block_number: desc }, limit: 10) {
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

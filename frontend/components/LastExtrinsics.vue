<template>
  <div class="last-extrinsics">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="extrinsics">
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              v-b-tooltip.hover
              :to="`/extrinsic/${data.item.block_number}/${data.item.extrinsic_index}`"
              title="Check extrinsic information"
            >
              #{{ formatNumber(data.item.block_number) }}-{{
                data.item.extrinsic_index
              }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(hash)="data">
          <p class="mb-0">
            {{ shortHash(data.item.hash) }}
          </p>
        </template>
        <template #cell(section)="data">
          <p class="mb-0">
            {{ data.item.section }} ➡
            {{ data.item.method }}
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
      extrinsics: [],
      fields: [
        {
          key: 'block_number',
          label: 'Id',
          sortable: false,
        },
        {
          key: 'hash',
          label: 'Hash',
          sortable: false,
        },
        {
          key: 'section',
          label: 'Extrinsic',
          sortable: false,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics {
            extrinsic(order_by: { block_number: desc }, where: {}, limit: 10) {
              block_number
              extrinsic_index
              is_signed
              signer
              section
              method
              hash
              doc
            }
          }
        `,
        result({ data }) {
          this.extrinsics = data.extrinsic
        },
      },
    },
  },
}
</script>

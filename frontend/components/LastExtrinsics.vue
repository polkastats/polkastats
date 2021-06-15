<template>
  <div class="last-extrinsics">
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="extrinsics">
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              v-b-tooltip.hover
              :to="`/block?blockNumber=${data.item.block_number}`"
              title="Check block information"
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
import commonMixin from '@/mixins/commonMixin.js'
import gql from 'graphql-tag'

export default {
  mixins: [commonMixin],
  data() {
    return {
      extrinsics: [],
      fields: [
        {
          key: 'block_number',
          label: 'Id',
          sortable: true,
        },
        {
          key: 'hash',
          label: 'Hash',
          class: 'd-none d-sm-none d-md-none d-lg-block d-xl-block',
          sortable: true,
        },
        {
          key: 'section',
          label: 'Extrinsic',
          sortable: true,
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

<style>
.last-extrinsics .table th,
.last-extrinsics .table td {
  padding: 0.45rem;
}
.last-extrinsics .table thead th {
  border-bottom: 0;
}
.last-extrinsics .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>

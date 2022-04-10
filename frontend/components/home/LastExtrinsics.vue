<template>
  <div class="last-extrinsics">
    <h3>
      <nuxt-link
        v-b-tooltip.hover
        :to="localePath(`/extrinsics`)"
        :title="$t('components.last_extrinsics.extrinsics_details')"
      >
        {{ $t('components.last_extrinsics.title') }}
      </nuxt-link>
    </h3>
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="extrinsics">
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              v-b-tooltip.hover
              :to="
                localePath(
                  `/extrinsic/${data.item.block_number}/${data.item.extrinsic_index}`
                )
              "
              :title="$t('components.last_extrinsics.extrinsic_details')"
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
          label: this.$t('components.last_extrinsics.id'),
          sortable: false,
        },
        {
          key: 'hash',
          label: this.$t('components.last_extrinsics.hash'),
          sortable: false,
        },
        {
          key: 'section',
          label: this.$t('components.last_extrinsics.extrinsic'),
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
            signed_extrinsic(order_by: { block_number: desc }, limit: 10) {
              block_number
              extrinsic_index
              signer
              section
              method
              hash
              doc
            }
          }
        `,
        result({ data }) {
          this.extrinsics = data.signed_extrinsic
        },
      },
    },
  },
}
</script>

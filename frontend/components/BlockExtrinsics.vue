<template>
  <div v-if="parsedExtrinsics.length > 0">
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ $t('details.block.hash') }}</th>
            <th>{{ $t('details.block.signer') }}</th>
            <th>{{ $t('details.block.section') }}</th>
            <th>{{ $t('details.block.method') }}</th>
            <th>{{ $t('details.block.success') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="extrinsic in parsedExtrinsics" :key="extrinsic.hash">
            <td>
              <nuxt-link
                v-b-tooltip.hover
                :to="`/extrinsic/${extrinsic.block_number}/${extrinsic.extrinsic_index}`"
                :title="$t('details.extrinsic.extrinsic_details')"
              >
                {{ extrinsic.block_number }}-{{ extrinsic.extrinsic_index }}
              </nuxt-link>
            </td>
            <td>{{ shortHash(extrinsic.hash) }}</td>
            <td>
              <span v-if="extrinsic.signer">
                <Identicon :address="extrinsic.signer" :size="20" />
                <nuxt-link
                  v-b-tooltip.hover
                  :to="`/account/${extrinsic.signer}`"
                  :title="$t('details.block.account_details')"
                >
                  {{ shortAddress(extrinsic.signer) }}
                </nuxt-link>
              </span>
            </td>
            <td>{{ extrinsic.section }}</td>
            <td>{{ extrinsic.method }}</td>
            <td>
              <font-awesome-icon
                v-if="extrinsic.success"
                icon="check"
                class="text-success"
              />
              <font-awesome-icon v-else icon="times" class="text-danger" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
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
      parsedExtrinsics: [],
    }
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
          this.parsedExtrinsics = data.extrinsic
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

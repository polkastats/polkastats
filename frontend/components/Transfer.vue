<template>
  <div v-if="transfer" class="table-responsive pb-4">
    <table class="table table-striped transfer-table">
      <tbody>
        <tr>
          <td>Block number</td>
          <td>
            <nuxt-link :to="`/block?blockNumber=${transfer.block_number}`">
              #{{ formatNumber(transfer.block_number) }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>Timestamp</td>
          <td>
            <p class="mb-0">
              {{ getDateFromTimestamp(transfer.timestamp) }}
            </p>
          </td>
        </tr>
        <tr>
          <td>Extrinsic</td>
          <td>
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="`/extrinsic/${transfer.block_number}/${transfer.extrinsic_index}`"
                title="Check extrinsic information"
              >
                #{{ formatNumber(transfer.block_number) }}-{{
                  transfer.extrinsic_index
                }}
              </nuxt-link>
            </p>
          </td>
        </tr>
        <tr>
          <td>Hash</td>
          <td>
            {{ transfer.hash }}
          </td>
        </tr>
        <tr>
          <td>From</td>
          <td>
            <div v-if="transfer.signer">
              <Identicon
                :key="transfer.signer"
                :address="transfer.signer"
                :size="20"
              />
              <nuxt-link :to="`/account/${transfer.signer}`">
                {{ transfer.signer }}
              </nuxt-link>
            </div>
          </td>
        </tr>
        <tr>
          <td>To</td>
          <td>
            <div v-if="JSON.parse(transfer.args)[0].id">
              <Identicon
                :key="JSON.parse(transfer.args)[0].id"
                :address="JSON.parse(transfer.args)[0].id"
                :size="20"
              />
              <nuxt-link :to="`/account/${JSON.parse(transfer.args)[0].id}`">
                {{ JSON.parse(transfer.args)[0].id }}
              </nuxt-link>
            </div>
          </td>
        </tr>
        <tr>
          <td>Amount</td>
          <td>
            {{ formatAmount(JSON.parse(transfer.args)[1]) }}
          </td>
        </tr>
        <tr>
          <td>Fee</td>
          <td class="amount">
            <div v-if="transfer.fee_info">
              {{ formatAmount(JSON.parse(transfer.fee_info).partialFee) }}
            </div>
          </td>
        </tr>
        <tr>
          <td>Success</td>
          <td>
            <font-awesome-icon
              v-if="transfer.success"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  props: {
    transfer: {
      type: Object,
      default: undefined,
    },
  },
}
</script>

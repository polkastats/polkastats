<template>
  <div v-if="transfer" class="table-responsive pb-0 mb-0">
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
              {{ getDateFromTimestamp(transfer.timestamp) }} ({{
                fromNow(transfer.timestamp)
              }})
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
            <div v-if="transfer.source">
              <Identicon
                :key="transfer.source"
                :address="transfer.source"
                :size="20"
              />
              <nuxt-link :to="`/account/${transfer.source}`">
                {{ transfer.source }}
              </nuxt-link>
            </div>
          </td>
        </tr>
        <tr>
          <td>To</td>
          <td>
            <Identicon
              :key="transfer.destination"
              :address="transfer.destination"
              :size="20"
            />
            <nuxt-link :to="`/account/${transfer.destination}`">
              {{ transfer.destination }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>Amount</td>
          <td>
            {{ formatAmount(transfer.amount, 6) }}
          </td>
        </tr>
        <tr>
          <td>Fee</td>
          <td class="amount">
            <div v-if="transfer.fee_amount">
              {{ formatAmount(transfer.fee_amount, 6) }}
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
        <tr v-if="transfer.error_message">
          <td>Error message</td>
          <td>
            {{ transfer.error_message }}
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

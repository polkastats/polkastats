<template>
  <div v-if="transfer" class="table-responsive pb-0 mb-0">
    <table class="table table-striped transfer-table">
      <tbody>
        <tr>
          <td>Hash</td>
          <td>
            {{ transfer.hash }}
          </td>
        </tr>
        <tr>
          <td>Status</td>
          <td>
            <Status
              :status="transfer.success"
              :error-message="transfer.error_message"
            />
          </td>
        </tr>
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
              <font-awesome-icon icon="clock" class="text-light" />
              {{ getDateFromTimestamp(transfer.timestamp) }} ({{
                fromNow(transfer.timestamp)
              }})
            </p>
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
            <span class="amount">{{ formatAmount(transfer.amount, 6) }}</span>
            <FIATConversion :units="transfer.amount" />
          </td>
        </tr>
        <tr>
          <td>Fee</td>
          <td>
            <div v-if="transfer.fee_amount">
              <span class="amount">{{
                formatAmount(transfer.fee_amount, 6)
              }}</span>
              <FIATConversion :units="transfer.fee_amount" />
            </div>
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
          <td>Method</td>
          <td>
            {{ transfer.method }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import Status from '@/components/Status.vue'
import FIATConversion from '@/components/FIATConversion.vue'
export default {
  components: {
    Status,
    FIATConversion,
  },
  mixins: [commonMixin],
  props: {
    transfer: {
      type: Object,
      default: undefined,
    },
  },
}
</script>

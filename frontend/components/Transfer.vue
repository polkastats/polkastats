<template>
  <div v-if="transfer" class="table-responsive pb-0 mb-0">
    <table class="table table-striped transfer-table">
      <tbody>
        <tr>
          <td>{{ $t('components.transfer.hash') }}</td>
          <td>
            <Hash :hash="transfer.hash" />
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.transfer.status') }}</td>
          <td>
            <Status
              :status="transfer.success"
              :error-message="transfer.error_message"
            />
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.transfer.block_number') }}</td>
          <td>
            <nuxt-link
              :to="localePath(`/block?blockNumber=${transfer.block_number}`)"
            >
              #{{ formatNumber(transfer.block_number) }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.transfer.timestamp') }}</td>
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
          <td>{{ $t('components.transfer.from') }}</td>
          <td>
            <div v-if="transfer.source">
              <Identicon
                :key="transfer.source"
                :address="transfer.source"
                :size="20"
              />
              <nuxt-link :to="localePath(`/account/${transfer.source}`)">
                {{ transfer.source }}
              </nuxt-link>
            </div>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.transfer.to') }}</td>
          <td>
            <Identicon
              :key="transfer.destination"
              :address="transfer.destination"
              :size="20"
            />
            <nuxt-link :to="localePath(`/account/${transfer.destination}`)">
              {{ transfer.destination }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.transfer.amount') }}</td>
          <td>
            <span class="amount">{{ formatAmount(transfer.amount, 6) }}</span>
            <FIATConversion
              :units="transfer.amount"
              :date="getDateFromTimestampDDMMYYYY(transfer.timestamp)"
            />
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.transfer.fee') }}</td>
          <td>
            <div v-if="transfer.fee_amount">
              <span class="amount">{{
                formatAmount(transfer.fee_amount, 6)
              }}</span>
              <FIATConversion
                :units="transfer.fee_amount"
                :date="getDateFromTimestampDDMMYYYY(transfer.timestamp)"
              />
            </div>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.transfer.extrinsic') }}</td>
          <td>
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="
                  localePath(
                    `/extrinsic/${transfer.block_number}/${transfer.extrinsic_index}`
                  )
                "
                :title="$t('common.extrinsic_details')"
              >
                #{{ formatNumber(transfer.block_number) }}-{{
                  transfer.extrinsic_index
                }}
              </nuxt-link>
            </p>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.transfer.method') }}</td>
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
import Hash from '@/components/Hash.vue'
export default {
  components: {
    Status,
    FIATConversion,
    Hash,
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

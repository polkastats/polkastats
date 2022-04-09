<template>
  <div v-if="extrinsic" class="table-responsive pb-0 mb-0">
    <table class="table table-striped extrinsic-table">
      <tbody>
        <tr>
          <td>{{ $t('components.extrinsic.hash') }}</td>
          <td>
            <Hash :hash="extrinsic.hash" />
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.extrinsic.status') }}</td>
          <td>
            <Status
              :status="extrinsic.success"
              :error-message="extrinsic.error_message"
            />
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.extrinsic.block_number') }}</td>
          <td>
            <nuxt-link
              v-b-tooltip.hover
              :to="localePath(`/block?blockNumber=${extrinsic.block_number}`)"
              :title="$t('common.block_details')"
            >
              #{{ formatNumber(extrinsic.block_number) }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.extrinsic.timestamp') }}</td>
          <td>
            <p class="mb-0">
              <font-awesome-icon icon="clock" class="text-light" />
              {{ getDateFromTimestamp(extrinsic.timestamp) }} ({{
                fromNow(extrinsic.timestamp)
              }})
            </p>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.extrinsic.extrinsic_index') }}</td>
          <td>
            {{ extrinsic.extrinsic_index }}
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.extrinsic.signed') }}</td>
          <td>
            <font-awesome-icon
              v-if="extrinsic.is_signed"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
          </td>
        </tr>
        <tr v-if="extrinsic.is_signed">
          <td>{{ $t('components.extrinsic.signer') }}</td>
          <td>
            <div v-if="extrinsic.signer">
              <Identicon :address="extrinsic.signer" :size="20" />
              <nuxt-link
                v-b-tooltip.hover
                :to="localePath(`/account/${extrinsic.signer}`)"
                :title="$t('details.block.account_details')"
              >
                {{ shortAddress(extrinsic.signer) }}
              </nuxt-link>
            </div>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.extrinsic.section_and_method') }}</td>
          <td>
            {{ extrinsic.section }} ➡
            {{ extrinsic.method }}
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.extrinsic.documentation') }}</td>
          <td>
            <div
              class="extrinsic-doc"
              v-html="$md.render(JSON.parse(extrinsic.doc).join('\n'))"
            ></div>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.extrinsic.arguments') }}</td>
          <td class="extrinsic-arg">
            <template v-for="(arg, index) in JSON.parse(extrinsic.args)">
              <b-card :key="`extrinsic-arg-def-${index}`" class="mb-2">
                <h6 class="mb-2">
                  {{ Object.entries(JSON.parse(extrinsic.args_def))[index][0] }}
                </h6>
                <pre class="pb-0 mb-0">{{ JSON.stringify(arg, null, 2) }}</pre>
              </b-card>
            </template>
          </td>
        </tr>
        <tr v-if="extrinsic.is_signed">
          <td>{{ $t('components.extrinsic.weight') }}</td>
          <td>
            <div v-if="extrinsic.fee_info">
              {{ formatNumber(JSON.parse(extrinsic.fee_info).weight) }}
            </div>
          </td>
        </tr>
        <tr v-if="extrinsic.is_signed">
          <td>{{ $t('components.extrinsic.fee_class') }}</td>
          <td>
            <div v-if="extrinsic.fee_info">
              {{ JSON.parse(extrinsic.fee_info).class }}
            </div>
          </td>
        </tr>
        <tr v-if="extrinsic.is_signed">
          <td>{{ $t('components.extrinsic.fee') }}</td>
          <td>
            <div v-if="extrinsic.fee_info">
              <span class="amount">{{
                formatAmount(JSON.parse(extrinsic.fee_info).partialFee, 6)
              }}</span>
              <FIATConversion
                :units="JSON.parse(extrinsic.fee_info).partialFee"
                :date="getDateFromTimestampDDMMYYYY(extrinsic.timestamp)"
              />
            </div>
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
    extrinsic: {
      type: Object,
      default: undefined,
    },
  },
}
</script>

<template>
  <div v-if="extrinsic" class="table-responsive pb-4">
    <table class="table table-striped extrinsic-table">
      <tbody>
        <tr>
          <td>Block number</td>
          <td>
            <nuxt-link
              v-b-tooltip.hover
              :to="`/block?blockNumber=${extrinsic.block_number}`"
              title="Check block information"
            >
              #{{ formatNumber(extrinsic.block_number) }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>Timestamp</td>
          <td>
            <p class="mb-0">
              {{ getDateFromTimestamp(extrinsic.timestamp) }} ({{
                fromNow(extrinsic.timestamp)
              }})
            </p>
          </td>
        </tr>
        <tr>
          <td>Extrinsic index</td>
          <td>
            {{ extrinsic.extrinsic_index }}
          </td>
        </tr>
        <tr>
          <td>Extrinsic hash</td>
          <td>
            {{ extrinsic.hash }}
          </td>
        </tr>
        <tr>
          <td>Signed?</td>
          <td>
            <font-awesome-icon
              v-if="extrinsic.is_signed"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
          </td>
        </tr>
        <tr>
          <td>Signer</td>
          <td>
            <div v-if="extrinsic.signer">
              <Identicon :address="extrinsic.signer" :size="20" />
              <nuxt-link
                v-b-tooltip.hover
                :to="`/account/${extrinsic.signer}`"
                :title="$t('details.block.account_details')"
              >
                {{ shortAddress(extrinsic.signer) }}
              </nuxt-link>
            </div>
          </td>
        </tr>
        <tr>
          <td>Section and method</td>
          <td>
            {{ extrinsic.section }} ➡
            {{ extrinsic.method }}
          </td>
        </tr>
        <tr>
          <td>Documentation</td>
          <td>
            <div
              class="extrinsic-doc"
              v-html="$md.render(JSON.parse(extrinsic.doc).join('\n'))"
            ></div>
          </td>
        </tr>
        <tr>
          <td>Arguments</td>
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
        <tr>
          <td>Weight</td>
          <td>
            <div v-if="extrinsic.fee_info">
              {{ formatNumber(JSON.parse(extrinsic.fee_info).weight) }}
            </div>
          </td>
        </tr>
        <tr>
          <td>Fee class</td>
          <td>
            <div v-if="extrinsic.fee_info">
              {{ JSON.parse(extrinsic.fee_info).class }}
            </div>
          </td>
        </tr>
        <tr>
          <td>Fee</td>
          <td class="amount">
            <div v-if="extrinsic.fee_info">
              {{ formatAmount(JSON.parse(extrinsic.fee_info).partialFee, 6) }}
            </div>
          </td>
        </tr>
        <tr>
          <td>Success</td>
          <td>
            <font-awesome-icon
              v-if="extrinsic.success"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
          </td>
        </tr>
        <tr v-if="extrinsic.error_message">
          <td>Error message</td>
          <td>
            {{ extrinsic.error_message }}
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
    extrinsic: {
      type: Object,
      default: undefined,
    },
  },
  methods: {
    setPageSize(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
}
</script>

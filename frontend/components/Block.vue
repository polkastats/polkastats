<template>
  <div class="card mt-4 mb-3">
    <div class="card-body">
      <h4 class="text-center mb-4">
        {{ $t('details.block.block') }} #{{
          formatNumber(parsedBlock.block_number)
        }}
      </h4>
      <table class="table table-striped block-table">
        <tbody>
          <tr>
            <td>{{ $t('details.block.timestamp') }}</td>
            <td class="text-right">
              <p class="mb-0">
                {{ getDateFromTimestamp(parsedBlock.timestamp) }}
              </p>
            </td>
          </tr>
          <tr>
            <td>{{ $t('details.block.finalized') }}</td>
            <td class="text-right">
              <p v-if="parsedBlock.finalized" class="mb-0">
                <font-awesome-icon icon="check" class="text-success" />
              </p>
              <p v-else class="mb-0">
                <font-awesome-icon icon="clock" class="text-light" />
              </p>
            </td>
          </tr>
          <tr>
            <td>{{ $t('details.block.block_hash') }}</td>
            <td class="text-right">
              <p class="mb-0">{{ parsedBlock.block_hash }}</p>
            </td>
          </tr>
          <tr>
            <td>{{ $t('details.block.extrinsic_root') }}</td>
            <td class="text-right">
              <p class="mb-0">{{ parsedBlock.extrinsics_root }}</p>
            </td>
          </tr>
          <tr>
            <td>{{ $t('details.block.parent_hash') }}</td>
            <td class="text-right">
              <span v-if="parsedBlock.block_number === 0"> -- </span>
              <span v-else>
                <nuxt-link
                  :to="`/block?blockNumber=${parsedBlock.block_number - 1}`"
                >
                  {{ parsedBlock.parent_hash }}
                </nuxt-link>
              </span>
            </td>
          </tr>
          <tr>
            <td>{{ $t('details.block.state_root') }}</td>
            <td class="text-right">
              <p class="mb-0">{{ parsedBlock.state_root }}</p>
            </td>
          </tr>
        </tbody>
      </table>
      <b-tabs class="mt-4" content-class="mt-4" fill>
        <b-tab active>
          <template #title>
            <h5>{{ $t('details.block.extrinsics') }}</h5>
          </template>
          <template v-if="parsedExtrinsics.length > 0">
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{{ $t('details.block.hash') }}</th>
                    <th>{{ $t('details.block.signer') }}</th>
                    <th>{{ $t('details.block.section') }}</th>
                    <th>{{ $t('details.block.method') }}</th>
                    <th>{{ $t('details.block.args') }}</th>
                    <th>{{ $t('details.block.success') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="extrinsic in parsedExtrinsics"
                    :key="extrinsic.hash"
                  >
                    <td>
                      <nuxt-link
                        v-b-tooltip.hover
                        :to="`/extrinsic/${extrinsic.block_number}/${extrinsic.extrinsic_index}`"
                        :title="$t('details.extrinsic.extrinsic_details')"
                      >
                        {{ extrinsic.block_number }}-{{
                          extrinsic.extrinsic_index
                        }}
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
                    <td>{{ extrinsic.args }}</td>
                    <td>
                      <font-awesome-icon
                        v-if="extrinsic.success"
                        icon="check"
                        class="text-success"
                      />
                      <font-awesome-icon
                        v-else
                        icon="times"
                        class="text-danger"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </b-tab>
        <b-tab>
          <template #title>
            <h5>{{ $t('details.block.system_events') }}</h5>
          </template>
          <template v-if="parsedEvents.length > 0">
            <div class="table-responsive">
              <table class="table table-striped">
                <thead>
                  <tr>
                    <th>{{ $t('details.block.section') }}</th>
                    <th>{{ $t('details.block.method') }}</th>
                    <th>{{ $t('details.block.phase') }}</th>
                    <th>{{ $t('details.block.data') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in parsedEvents" :key="event.event_index">
                    <td>{{ event.section }}</td>
                    <td>{{ event.method }}</td>
                    <td>{{ event.phase }}</td>
                    <td>
                      <template
                        v-if="
                          event.section === `balances` &&
                          event.method === `Transfer`
                        "
                      >
                        <Identicon
                          :address="JSON.parse(event.data)[0]"
                          :size="20"
                        />
                        <nuxt-link
                          v-b-tooltip.hover
                          :to="`/account/${JSON.parse(event.data)[0]}`"
                          :title="$t('details.block.account_details')"
                        >
                          {{ shortAddress(JSON.parse(event.data)[0]) }}
                        </nuxt-link>
                        <font-awesome-icon icon="arrow-right" />
                        <Identicon
                          :address="JSON.parse(event.data)[1]"
                          :size="20"
                        />
                        <nuxt-link
                          v-b-tooltip.hover
                          :to="`/account/${JSON.parse(event.data)[1]}`"
                          :title="$t('details.block.account_details')"
                        >
                          {{ shortAddress(JSON.parse(event.data)[1]) }}
                        </nuxt-link>
                        <font-awesome-icon icon="arrow-right" />
                        <span class="amount">
                          {{ formatAmount(JSON.parse(event.data)[2]) }}
                        </span>
                      </template>
                      <template v-else>
                        {{ event.data }}
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>

<script>
import Identicon from '@/components/Identicon.vue'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  components: {
    Identicon,
  },
  mixins: [commonMixin],
  props: {
    parsedBlock: {
      type: Object,
      default: () => {},
    },
    parsedExtrinsics: {
      type: Array,
      default: () => [],
    },
    parsedEvents: {
      type: Array,
      default: () => [],
    },
  },
}
</script>

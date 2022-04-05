<template>
  <div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <template v-else-if="!parsedBlock">
      <h1 class="text-center">Block not found!</h1>
    </template>
    <template v-else>
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
                    <font-awesome-icon icon="clock" class="text-light" />
                    {{ getDateFromTimestamp(parsedBlock.timestamp) }} ({{
                      fromNow(parsedBlock.timestamp)
                    }})
                  </p>
                </td>
              </tr>
              <tr>
                <td>{{ $t('details.block.block_author') }}</td>
                <td class="text-right">
                  <span v-if="parsedBlock.block_number === 0">
                    {{ $t('details.block.genesis') }}
                  </span>
                  <span v-else>
                    <nuxt-link
                      :to="`/validator/${parsedBlock.block_author}`"
                      class="d-block"
                    >
                      <Identicon
                        :address="parsedBlock.block_author"
                        :size="20"
                      />
                      <span
                        v-b-tooltip.hover
                        :title="$t('details.block.account_details')"
                      >
                        {{ shortAddress(parsedBlock.block_author) }}
                      </span>
                      <span v-if="parsedBlock.block_author_name !== ``"
                        >( {{ parsedBlock.block_author_name }} )</span
                      >
                    </nuxt-link>
                  </span>
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
              <tr>
                <td>{{ $t('details.block.current_index') }}</td>
                <td class="text-right">
                  <p class="mb-0">{{ parsedBlock.current_index }}</p>
                </td>
              </tr>
              <tr>
                <td>{{ $t('details.block.active_era') }}</td>
                <td class="text-right">
                  <p class="mb-0">{{ parsedBlock.active_era }}</p>
                </td>
              </tr>
              <tr>
                <td>{{ $t('details.block.spec_version') }}</td>
                <td class="text-right">
                  <p class="mb-0">{{ parsedBlock.spec_version }}</p>
                </td>
              </tr>
            </tbody>
          </table>
          <b-tabs class="mt-4" content-class="mt-4" fill>
            <b-tab active>
              <template #title>
                <h5 class="d-inline-block">
                  {{ $t('details.block.extrinsics') }}
                </h5>
                <span v-if="totalExtrinsics">[{{ totalExtrinsics }}]</span>
              </template>
              <BlockExtrinsics
                :block-number="blockNumber"
                @totalExtrinsics="onTotalExtrinsics"
              />
            </b-tab>
            <b-tab>
              <template #title>
                <h5 class="d-inline-block">{{ $t('details.block.events') }}</h5>
                <span v-if="totalEvents">[{{ totalEvents }}]</span>
              </template>
              <BlockEvents
                :block-number="blockNumber"
                @totalEvents="onTotalEvents"
              />
            </b-tab>
            <b-tab>
              <template #title>
                <h5 class="d-inline-block">{{ $t('details.block.logs') }}</h5>
                <span v-if="totalLogs">[{{ totalLogs }}]</span>
              </template>
              <BlockLogs :block-number="blockNumber" @totalLogs="onTotalLogs" />
            </b-tab>
          </b-tabs>
        </div>
      </div>
    </template>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import BlockExtrinsics from '@/components/block/BlockExtrinsics.vue'
import BlockEvents from '@/components/block/BlockEvents.vue'
import BlockLogs from '@/components/block/BlockLogs.vue'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  components: {
    BlockExtrinsics,
    BlockEvents,
    BlockLogs,
  },
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
      parsedBlock: undefined,
      totalExtrinsics: undefined,
      totalEvents: undefined,
      totalLogs: undefined,
    }
  },
  methods: {
    onTotalExtrinsics(value) {
      this.totalExtrinsics = value
    },
    onTotalEvents(value) {
      this.totalEvents = value
    },
    onTotalLogs(value) {
      this.totalLogs = value
    },
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription block($block_number: bigint!) {
            block(where: { block_number: { _eq: $block_number } }) {
              block_author
              finalized
              block_author_name
              block_hash
              block_number
              extrinsics_root
              parent_hash
              state_root
              current_index
              active_era
              spec_version
              timestamp
              total_events
              total_extrinsics
            }
          }
        `,
        variables() {
          return {
            block_number: this.blockNumber,
          }
        },
        result({ data }) {
          if (data.block[0]) {
            this.parsedBlock = data.block[0]
          }
          this.loading = false
        },
      },
    },
  },
}
</script>

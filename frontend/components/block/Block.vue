<template>
	<main>
		<section v-if="loading" class="section text-center py-4">
			<Loading />
		</section>
		<section v-else-if="!parsedBlock" class="section text-center">
			<h1>{{ $t('components.block.not_found') }}</h1>
		</section>
		<template v-else>

			<header-component>
				<search-section :title="$t('details.block.block')" :subtitle="formatNumber(parsedBlock.block_number)" />
			</header-component>

			<section class="section" color="i-third-1">

				<!-- TODO: Translate -->
				<header class="header-block mb-4" size="sm">
					<h1>Specs</h1>
					<h2 class="text-i-fourth">Important info of the block</h2>
				</header>

				<section class="text-i-fifth overflow-hidden small">

						<spec-item :title="$t('details.block.timestamp')" icon="clock" :multi="true">
							<spec-item>
								{{ getDateFromTimestamp(parsedBlock.timestamp) }}
							</spec-item>
							<spec-item variant="i-fourth" sm="2">
								{{ fromNow(parsedBlock.timestamp) }}
							</spec-item>
						</spec-item>
						<spec-item :title="$t('details.block.block_author')">
							<template v-if="parsedBlock.block_number === 0">
								{{ $t('details.block.genesis') }}
							</template>
							<template v-else>
								<nuxt-link
								:to="localePath(`/validator/${parsedBlock.block_author}`)"
								class="d-block"
								>
								<Identicon
									class="mr-1"
									:address="parsedBlock.block_author"
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
							</template>
						</spec-item>
						<spec-item :title="$t('details.block.status')" :multi="true">
							<spec-item v-if="parsedBlock.finalized" variant="i-success">
								<font-awesome-icon icon="check" />
								{{ $t('common.finalized') }}
							</spec-item>
							<spec-item v-else variant="warning">
								<font-awesome-icon icon="spinner" spin />
								{{ $t('common.processing') }}
							</spec-item>
						</spec-item>
						<spec-item :title="$t('details.block.block_hash')" :multi="true">
							<Hash :unclass="true" :hash="parsedBlock.block_hash" />
						</spec-item>
						<spec-item :title="$t('details.block.extrinsic_root')">
							{{ parsedBlock.extrinsics_root }}
						</spec-item>
						<spec-item :title="$t('details.block.parent_hash')">
							<span v-if="parsedBlock.block_number === 0"> -- </span>
							<span v-else>
								<nuxt-link
								:to="
									localePath(
									`/block?blockNumber=${parsedBlock.block_number - 1}`
									)
								"
								>
								{{ parsedBlock.parent_hash }}
								</nuxt-link>
							</span>
						</spec-item>
						<spec-item :title="$t('details.block.state_root')">
							<p class="mb-0">{{ parsedBlock.state_root }}</p>
						</spec-item>
						<spec-item :title="$t('details.block.current_index')">
							<p class="mb-0">{{ parsedBlock.current_index }}</p>
						</spec-item>
						<spec-item :title="$t('details.block.active_era')">
							<p class="mb-0">{{ parsedBlock.active_era }}</p>
						</spec-item>
						<spec-item :title="$t('details.block.spec_version')">
							<p class="mb-0">{{ parsedBlock.spec_version }}</p>
						</spec-item>

				</section>
			</section>

			<section class="section section-tabs" color="i-fifth-1">

				<b-tabs active-nav-item-class="text-i-primary" align="center">
					<b-tab>
						<template #title>
							<h6>
								{{ $t('details.block.extrinsics') }}
								<b-badge v-if="totalExtrinsics" variant="i-third-25" class="ml-1 text-xs">{{ totalExtrinsics }}</b-badge>
							</h6>
						</template>
						<BlockExtrinsics
							:block-number="blockNumber"
							@totalExtrinsics="onTotalExtrinsics"
						/>
					</b-tab>
					<b-tab>
						<template #title>
							<h6>
								{{ $t('details.block.events') }}
								<b-badge v-if="totalEvents" variant="i-third-25" class="ml-1 text-xs">{{ totalEvents }}</b-badge>
							</h6>
						</template>
						<BlockEvents
							:block-number="blockNumber"
							@totalEvents="onTotalEvents"
						/>
					</b-tab>
					<b-tab>
						<template #title>
							<h6>
								{{ $t('details.block.logs') }}
								<b-badge v-if="totalLogs" variant="i-third-25" class="ml-1 text-xs">{{ totalLogs }}</b-badge>
							</h6>
						</template>
						<BlockLogs :block-number="blockNumber" @totalLogs="onTotalLogs" />
					</b-tab>
				</b-tabs>
			</section>

		</template>

	</main>


  <!-- <div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <template v-else-if="!parsedBlock">
      <h1 class="text-center">{{ $t('components.block.not_found') }}</h1>
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
                      :to="localePath(`/validator/${parsedBlock.block_author}`)"
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
                <td>{{ $t('details.block.status') }}</td>
                <td class="text-right">
                  <p v-if="parsedBlock.finalized" class="mb-0">
                    <font-awesome-icon icon="check" class="text-success" />
                    {{ $t('common.finalized') }}
                  </p>
                  <p v-else class="mb-0">
                    <font-awesome-icon icon="spinner" class="text-light" spin />
                    {{ $t('common.processing') }}
                  </p>
                </td>
              </tr>
              <tr>
                <td>{{ $t('details.block.block_hash') }}</td>
                <td class="text-right">
                  <p class="mb-0"><Hash :hash="parsedBlock.block_hash" /></p>
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
                      :to="
                        localePath(
                          `/block?blockNumber=${parsedBlock.block_number - 1}`
                        )
                      "
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
  </div> -->
</template>
<script>
import { gql } from 'graphql-tag'
import BlockExtrinsics from '@/components/block/BlockExtrinsics.vue'
import BlockEvents from '@/components/block/BlockEvents.vue'
import BlockLogs from '@/components/block/BlockLogs.vue'
import Hash from '@/components/Hash.vue'
import commonMixin from '@/mixins/commonMixin.js'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'
import SpecItem from '@/components/more/SpecItem.vue'

export default {
  components: {
    BlockExtrinsics,
    BlockEvents,
    BlockLogs,
    Hash,
	HeaderComponent,
	SearchSection,
	SpecItem,
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
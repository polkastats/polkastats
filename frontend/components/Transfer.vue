<template>

	<section v-if="transfer" class="section" color="i-third-1">

		<!-- TODO: Translate -->
		<header class="header-block mb-4" size="sm">
			<h1>Specs</h1>
			<h2 class="text-i-fourth">Important info of the transfer</h2>
		</header>

		<section class="text-i-fifth overflow-hidden small">

			<spec-item :title="$t('components.transfer.hash')" :multi="true">
				<Hash :unclass="true" :hash="transfer.hash" />
			</spec-item>
			
			<spec-item :title="$t('components.transfer.status')" :multi="true">
				
				<Status
					:unclass="true"
					:status="transfer.success"
					:error-message="transfer.error_message"
				/>

			</spec-item>

			<spec-item :title="$t('components.transfer.block_number')" icon="cube">
				
				<nuxt-link :to="localePath(`/block?blockNumber=${transfer.block_number}`)">
					#{{ formatNumber(transfer.block_number) }}
				</nuxt-link>

			</spec-item>

			<spec-item :title="$t('components.transfer.timestamp')" icon="clock" :multi="true">
				
					<spec-item>
						{{ getDateFromTimestamp(transfer.timestamp) }}
					</spec-item>
					<spec-item variant="i-fourth" sm="2">
						{{ fromNow(transfer.timestamp) }}
					</spec-item>

			</spec-item>

			<spec-item :title="$t('components.transfer.from')">

				<Identicon
					:key="transfer.source"
					:address="transfer.source"
				/>
				<span v-if="transfer.source" class="align-middle ml-1">
					<nuxt-link :to="localePath(`/account/${transfer.source}`)">
						{{ transfer.source }}
					</nuxt-link>
				</span>

			</spec-item>

			<spec-item :title="$t('components.transfer.to')">
				
				<Identicon
					:key="transfer.destination"
					:address="transfer.destination"
				/>
				<span class="align-middle ml-1">
					<nuxt-link :to="localePath(`/account/${transfer.destination}`)">
					{{ transfer.destination }}
					</nuxt-link>
				</span>

			</spec-item>

			<spec-item :title="$t('components.transfer.amount')" :multi="true">

				<spec-item>
					{{ formatAmount(transfer.amount, 6) }}
				</spec-item>
				<spec-item variant="i-primary">
					<FIATConversion
						variant="i-fourth"
						:units="transfer.amount"
						:timestamp="transfer.timestamp"
					/>
				</spec-item>

			</spec-item>

			<spec-item :title="$t('components.transfer.fee')" :multi="true">

				<spec-item>
					{{ formatAmount(transfer.fee_amount, 6) }}
				</spec-item>
				<spec-item variant="i-primary">
					<FIATConversion
						variant="i-fourth"
						:units="transfer.fee_amount"
						:timestamp="transfer.timestamp"
					/>
				</spec-item>

			</spec-item>

			<spec-item :title="$t('components.transfer.extrinsic')">
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
			</spec-item>

			<spec-item :title="$t('components.transfer.method')">
				{{ transfer.method }}
			</spec-item>
			
		</section>

	</section>
	
  <!-- <div v-if="transfer" class="table-responsive pb-0 mb-0">
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
              :timestamp="transfer.timestamp"
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
                :timestamp="transfer.timestamp"
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
  </div> -->
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import Hash from '@/components/Hash.vue'
import Status from '@/components/Status.vue'
import Identicon from '@/components/Identicon.vue'
import FIATConversion from '@/components/FIATConversion.vue'
import SpecItem from '@/components/more/SpecItem.vue'

export default {
  components: {
    Hash,
    Status,
    Identicon,
    FIATConversion,
	SpecItem
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

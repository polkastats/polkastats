<template>

	<section v-if="extrinsic" class="section" color="i-third-1">

		<header class="header-block mb-4" size="sm">
			<h1>Specs</h1>
			<h2 class="text-i-fourth">Important info of the extrinsic</h2>
		</header>

		<section class="text-i-fifth overflow-hidden small">

			<spec-item :title="$t('components.extrinsic.hash')" :multi="true">
				<Hash :unclass="true" :hash="extrinsic.hash" />
			</spec-item>
			<spec-item :title="$t('components.extrinsic.status')" :multi="true">
				<Status
					:unclass="true"
					:status="extrinsic.success"
					:error-message="extrinsic.error_message"
				/>
			</spec-item>
			<spec-item :title="$t('components.extrinsic.block_number')">
				<nuxt-link
					v-b-tooltip.hover
					:to="localePath(`/block?blockNumber=${extrinsic.block_number}`)"
					:title="$t('common.block_details')"
				>
					#{{ formatNumber(extrinsic.block_number) }}
				</nuxt-link>
			</spec-item>
			<spec-item :title="$t('components.extrinsic.timestamp')" icon="clock" :multi="true">
				<spec-item>
					{{ getDateFromTimestamp(extrinsic.timestamp) }}
				</spec-item>
				<spec-item variant="i-fourth" sm="2">
					{{ fromNow(extrinsic.timestamp) }}
				</spec-item>
			</spec-item>
			<spec-item :title="$t('components.extrinsic.extrinsic_index')">
				{{ extrinsic.extrinsic_index }}
			</spec-item>
			<spec-item :title="$t('components.extrinsic.signed')" :multi="true">
				<spec-item v-if="extrinsic.is_signed" variant="i-success">
					<font-awesome-icon icon="check" class="mr-1" />
				</spec-item>
				<spec-item v-else variant="i-danger">
					<font-awesome-icon icon="times" class="mr-1" />
				</spec-item>
			</spec-item>
			<spec-item v-if="extrinsic.is_signed" :title="$t('components.extrinsic.signer')">
				<template v-if="extrinsic.signer">
					<Identicon :address="extrinsic.signer" />
					<nuxt-link
						v-b-tooltip.hover
						:to="localePath(`/account/${extrinsic.signer}`)"
						:title="$t('details.block.account_details')"
					>
						{{ shortAddress(extrinsic.signer) }}
					</nuxt-link>
				</template>
			</spec-item>
			<spec-item :title="$t('components.extrinsic.section_and_method')">
				<div class="timeline ml-2 pl-1" variant="i-primary">
					<span class="timeline-item">{{ extrinsic.section }}</span>
					<span class="timeline-item">{{ extrinsic.method }}</span>
				</div>
			</spec-item>
			<spec-item :title="$t('components.extrinsic.documentation')">
				<div
					class="pkd-html"
					variant="i-primary"
					v-html="$md.render(JSON.parse(extrinsic.doc).join('\n'))"
				></div>
			</spec-item>
			<spec-item :title="$t('components.extrinsic.arguments')">
				<template v-for="(arg, index) in JSON.parse(extrinsic.args)">
					<div :key="`extrinsic-arg-def-${index}`" class="m-1">
						<b class="d-block">{{ Object.entries(JSON.parse(extrinsic.args_def))[index][0] }}</b>
						<code class="text-i-primary">{{ JSON.stringify(arg, null, 2) }}</code>
					</div>
				</template>
			</spec-item>

			<template v-if="extrinsic.is_signed">
				<spec-item :title="$t('components.extrinsic.weight')">
					<template v-if="extrinsic.fee_info">
						{{ formatNumber(JSON.parse(extrinsic.fee_info).weight) }}
					</template>
				</spec-item>
				<spec-item :title="$t('components.extrinsic.fee_class')">
					<template v-if="extrinsic.fee_info">
						{{ JSON.parse(extrinsic.fee_info).class }}
					</template>
				</spec-item>
				<spec-item :title="$t('components.extrinsic.fee')" :multi="true">
					<template v-if="extrinsic.fee_info">
						<spec-item>
							{{ formatAmount(JSON.parse(extrinsic.fee_info).partialFee, 6) }}
						</spec-item>
						<spec-item variant="i-primary">
							<FIATConversion
								variant="i-fourth"
								:units="JSON.parse(extrinsic.fee_info).partialFee"
								:timestamp="extrinsic.timestamp"
							/>
						</spec-item>
					</template>
				</spec-item>
			</template>

		</section>

	</section>

  <!-- <div v-if="extrinsic" class="table-responsive pb-0 mb-0">
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
                :timestamp="extrinsic.timestamp"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div> -->
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import Status from '@/components/Status.vue'
import FIATConversion from '@/components/FIATConversion.vue'
import Hash from '@/components/Hash.vue'
import SpecItem from '@/components/more/SpecItem.vue'

export default {
  components: {
    Status,
    FIATConversion,
    Hash,
	SpecItem
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

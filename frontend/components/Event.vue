<template>

	<section v-if="event" class="section" color="i-third-1">

		<!-- TODO: Translate -->
		<header class="header-block mb-4" size="sm">
			<h1>Specs</h1>
			<h2 class="text-i-fourth">Important info of the event</h2>
		</header>

		<section class="text-i-fifth overflow-hidden small">

			<spec-item :title="$t('components.event.block_number')" icon="cube">
				<nuxt-link
				v-b-tooltip.hover
				:to="localePath(`/block?blockNumber=${event.block_number}`)"
				:title="$t('common.block_details')"
				>
					#{{ formatNumber(event.block_number) }}
				</nuxt-link>
			</spec-item>
			<spec-item :title="$t('components.event.timestamp')" icon="clock" :multi="true">
				<spec-item>{{ getDateFromTimestamp(event.timestamp) }}</spec-item>
				<spec-item variant="i-fourth">{{ fromNow(event.timestamp) }}</spec-item>
			</spec-item>
			<spec-item :title="$t('components.event.event_index')">
				{{ event.event_index }}
			</spec-item>
			<spec-item v-if="isTriggeredByExtrinsic(event.phase)" :title="$t('components.event.triggered_by_extrinsic')">
				<nuxt-link
				:to="
					localePath(
					`/extrinsic/${event.block_number}/${
						JSON.parse(event.phase).applyExtrinsic
					}`
					)
				"
				>
				#{{ formatNumber(event.block_number) }}-{{
					JSON.parse(event.phase).applyExtrinsic
				}}
				</nuxt-link>
			</spec-item>
			<spec-item :title="$t('components.event.section_and_method')">
				<div class="timeline ml-2" variant="i-primary">
					<span class="timeline-item">{{ event.section }}</span>
					<span class="timeline-item">{{ event.method }}</span>
				</div>
			</spec-item>
			<spec-item :title="$t('components.event.documentation')">
				<div
					class="pkd-html"
					variant="i-primary"
					v-html="$md.render(JSON.parse(event.doc).join('\n'))"
				></div>
			</spec-item>
			<spec-item :title="$t('components.event.phase')">
				{{ event.phase }}
			</spec-item>
			<spec-item :title="$t('components.event.data')">
				<template v-for="(data, index) in JSON.parse(event.data)">
					<div :key="`event-data-${index}`" class="m-1">
						<b class="d-block">
							{{ getDescriptorOrType(JSON.parse(event.types)[index].type) }}
						</b>
						<code class="text-i-primary">{{ JSON.stringify(data, null, 2) }}</code>
					</div>
				</template>
			</spec-item>

		</section>
	</section>

  <!-- <div v-if="event" class="table-responsive pb-0 mb-0">
    <table class="table table-striped event-table">
      <tbody>
        <tr>
          <td>{{ $t('components.event.block_number') }}</td>
          <td>
            <nuxt-link
              v-b-tooltip.hover
              :to="localePath(`/block?blockNumber=${event.block_number}`)"
              :title="$t('common.block_details')"
            >
              #{{ formatNumber(event.block_number) }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.event.timestamp') }}</td>
          <td>
            <p class="mb-0">
              <font-awesome-icon icon="clock" class="text-light" />
              {{ getDateFromTimestamp(event.timestamp) }} ({{
                fromNow(event.timestamp)
              }})
            </p>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.event.event_index') }}</td>
          <td>
            {{ event.event_index }}
          </td>
        </tr>
        <tr v-if="isTriggeredByExtrinsic(event.phase)">
          <td>{{ $t('components.event.triggered_by_extrinsic') }}</td>
          <td>
            <nuxt-link
              :to="
                localePath(
                  `/extrinsic/${event.block_number}/${
                    JSON.parse(event.phase).applyExtrinsic
                  }`
                )
              "
            >
              #{{ formatNumber(event.block_number) }}-{{
                JSON.parse(event.phase).applyExtrinsic
              }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.event.section_and_method') }}</td>
          <td>
            {{ event.section }} ➡
            {{ event.method }}
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.event.documentation') }}</td>
          <td>
            <div
              class="extrinsic-doc"
              v-html="$md.render(JSON.parse(event.doc).join('\n'))"
            ></div>
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.event.phase') }}</td>
          <td>
            {{ event.phase }}
          </td>
        </tr>
        <tr>
          <td>{{ $t('components.event.data') }}</td>
          <td class="event-arg">
            <template v-for="(data, index) in JSON.parse(event.data)">
              <b-card :key="`event-data-${index}`" class="mb-2">
                <h6 class="mb-2">
                  {{ getDescriptorOrType(JSON.parse(event.types)[index].type) }}
                </h6>
                <pre class="pb-0 mb-0">{{ JSON.stringify(data, null, 2) }}</pre>
              </b-card>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div> -->
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import SpecItem from '@/components/more/SpecItem.vue'

export default {
	components: { SpecItem },
  mixins: [commonMixin],
  props: {
    event: {
      type: Object,
      default: undefined,
    },
  },
  methods: {
    getDescriptorOrType(descriptorOrType) {
      try {
        return JSON.parse(descriptorOrType).descriptor
      } catch (error) {
        // console.log(error)
      }
      return descriptorOrType
    },
    isTriggeredByExtrinsic(phase) {
      try {
        return JSON.parse(phase).applyExtrinsic
      } catch (error) {
        // console.log(error)
      }
      return false
    },
  },
}
</script>

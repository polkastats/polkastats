<template>
  <div v-if="event" class="table-responsive pb-0 mb-0">
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
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
export default {
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

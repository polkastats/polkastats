<template>
  <div v-if="event" class="table-responsive pb-4">
    <table class="table table-striped event-table">
      <tbody>
        <tr>
          <td>Block number</td>
          <td>
            <nuxt-link
              v-b-tooltip.hover
              :to="`/block?blockNumber=${event.block_number}`"
              title="Check block information"
            >
              #{{ formatNumber(event.block_number) }}
            </nuxt-link>
          </td>
        </tr>
        <tr>
          <td>Timestamp</td>
          <td>
            <p class="mb-0">
              {{ getDateFromTimestamp(event.timestamp) }}
            </p>
          </td>
        </tr>
        <tr>
          <td>Event index</td>
          <td>
            {{ event.event_index }}
          </td>
        </tr>
        <tr>
          <td>Section and method</td>
          <td>
            {{ event.section }} ➡
            {{ event.method }}
          </td>
        </tr>
        <tr>
          <td>Documentation</td>
          <td>
            <div
              class="extrinsic-doc"
              v-html="$md.render(JSON.parse(event.doc).join('\n'))"
            ></div>
          </td>
        </tr>
        <tr>
          <td>Phase</td>
          <td>
            {{ event.phase }}
          </td>
        </tr>
        <tr>
          <td>Data</td>
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
        <tr>
          <td>Types</td>
          <td>
            <pre class="mb-0">{{
              JSON.stringify(JSON.parse(event.types), null, 2)
            }}</pre>
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
  },
}
</script>

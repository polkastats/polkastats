<template>
  <div class="last-events">
    <h3>
      <nuxt-link
        v-b-tooltip.hover
        :to="localePath(`/events`)"
        :title="$t('components.last_events.events_details')"
      >
        {{ $t('components.last_events.title') }}
      </nuxt-link>
    </h3>
    <div class="table-responsive">
      <b-table striped hover :fields="fields" :items="events">
        <template #cell(block_number)="data">
          <p class="mb-0">
            <nuxt-link
              :to="
                localePath(
                  `/event/${data.item.block_number}/${data.item.event_index}`
                )
              "
            >
              #{{ formatNumber(data.item.block_number) }}-{{
                data.item.event_index
              }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(section)="data">
          <p class="mb-0">
            {{ data.item.section }} ➡
            {{ data.item.method }}
          </p>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      events: [],
      fields: [
        {
          key: 'block_number',
          label: this.$t('components.last_events.id'),
          sortable: false,
        },
        {
          key: 'section',
          label: this.$t('components.last_events.event'),
          sortable: false,
        },
      ],
    }
  },
  apollo: {
    $subscribe: {
      event: {
        query: gql`
          subscription events {
            event(order_by: { block_number: desc }, limit: 10) {
              block_number
              event_index
              section
              method
            }
          }
        `,
        result({ data }) {
          this.events = data.event
        },
      },
    },
  },
}
</script>

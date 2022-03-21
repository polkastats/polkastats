<template>
  <div>
    <section>
      <b-container class="event-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!parsedEvent">
          <h1 class="text-center">Event not found!</h1>
        </template>
        <template v-else>
          <div class="card mt-4 mb-3">
            <div class="card-body">
              <h4 class="text-center mb-4">
                Event {{ blockNumber }}-{{ eventIndex }}
              </h4>
              <Event :event="parsedEvent" />
            </div>
          </div>
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import Event from '../../../components/Event.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  components: {
    Loading,
    Event,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      blockNumber: this.$route.params.block,
      eventIndex: this.$route.params.index,
      parsedEvent: undefined,
    }
  },
  head() {
    return {
      title: 'PolkaStats NG block explorer',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'PolkaStats block explorer',
        },
      ],
    }
  },
  watch: {
    $route() {
      this.blockNumber = this.$route.params.block
      this.eventIndex = this.$route.params.index
    },
  },
  apollo: {
    event: {
      query: gql`
        query event($block_number: bigint!, $event_index: Int!) {
          event(
            where: {
              block_number: { _eq: $block_number }
              event_index: { _eq: $event_index }
            }
          ) {
            block_number
            event_index
            data
            method
            phase
            types
            doc
            section
            timestamp
          }
        }
      `,
      skip() {
        return !this.blockNumber || !this.eventIndex
      },
      variables() {
        return {
          block_number: parseInt(this.blockNumber),
          event_index: parseInt(this.eventIndex),
        }
      },
      result({ data }) {
        this.parsedEvent = data.event[0]
        this.loading = false
      },
    },
  },
}
</script>

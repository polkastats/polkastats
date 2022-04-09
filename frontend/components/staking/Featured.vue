<template>
  <div>
    <b-alert v-if="featured" class="text-center" show dismissible>
      <h4>{{ $t('components.featured.title') }}</h4>
      <p>
        {{ $t('components.featured.description') }}
      </p>
      <Identicon :address="featured.stash_address" :size="24" />
      <nuxt-link :to="localePath(`/validator/${featured.stash_address}`)">
        <span v-if="featured.name">{{ featured.name }}</span>
        <span v-else>{{ shortAddress(featured.stash_address) }}</span>
      </nuxt-link>
      <b-button
        :disabled="disabled"
        variant="outline-primary"
        @click="toggleSelected(featured.stash_address)"
        >{{ $t('components.featured.add') }}</b-button
      >
    </b-alert>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  data() {
    return {
      disabled: false,
      featured: null,
    }
  },
  methods: {
    toggleSelected(accountId) {
      this.$store.dispatch('ranking/toggleSelected', { accountId })
      this.disabled = true
    },
  },
  apollo: {
    $subscribe: {
      featured: {
        query: gql`
          subscription featured {
            featured(order_by: { timestamp: desc }, limit: 1) {
              stash_address
              name
            }
          }
        `,
        result({ data }) {
          this.featured = data.featured[0]
        },
      },
    },
  },
}
</script>

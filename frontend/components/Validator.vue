<template>
  <div v-if="validator">
    <span
      v-b-tooltip.hover
      title="VRC ranking"
      style="display: inline-block; width: 2.4rem"
      >#{{ validator.rank }}</span
    >
    <Identicon :address="validator.stashAddress" :size="22" />
    <nuxt-link :to="localePath(`/validator/${validator.stashAddress}`)">
      <span v-if="validator.name">{{ validator.name }}</span>
      <span v-else>{{ shortAddress(validator.stashAddress) }}</span>
    </nuxt-link>
    <VerifiedIcon v-if="validator.verifiedIdentity" />
  </div>
</template>

<script>
import Identicon from '@/components/Identicon.vue'
import VerifiedIcon from '@/components/VerifiedIcon.vue'

export default {
  components: {
    Identicon,
    VerifiedIcon,
  },
  props: {
    address: {
      type: String,
      default: () => '',
    },
  },
  computed: {
    validator() {
      return this.$store.state.ranking.list.find(
        ({ stashAddress }) => stashAddress === this.address
      )
    },
  },
}
</script>

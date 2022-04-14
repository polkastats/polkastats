<template>
  <div class="mt-0 mb-4">
    <a
      v-for="link in links.validator"
      :key="`${link.path}${accountId}`"
      v-b-tooltip.hover
      :href="`${link.path}${accountId}`"
      target="_blank"
      class="validator-link mx-1"
      :title="`${$t('components.validator_links.check_validator')} ${
        link.name
      }`"
    >
      <img :src="`/img/icons/${link.icon}`" />
    </a>
  </div>
</template>

<script>
import { links } from '@/frontend.config.js'

export default {
  props: {
    accountId: {
      required: true,
      type: String,
      default: '',
    },
  },
  data() {
    return {
      links,
    }
  },
}
</script>

<style>
.validator-link img {
  height: 1.2rem;
  width: 1.2rem;
  border-radius: 1.2rem;
  opacity: 0.5;
}
.validator-link img:hover {
  height: 1.2rem;
  width: 1.2rem;
  border-radius: 1.2rem;
  opacity: 1;
}
</style>

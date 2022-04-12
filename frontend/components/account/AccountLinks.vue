<template>
  <div class="text-center mt-0 mb-4">
    <a
      v-for="link in links"
      :key="`${link.path}${accountId}`"
      v-b-tooltip.hover
      :href="`${link.path}${accountId}`"
      target="_blank"
      class="account-link mx-1"
      :title="`${$t('components.account_links.check_account')} ${link.name}`"
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
.account-link img {
  height: 1.3rem;
  width: 1.3rem;
  border-radius: 1.3rem;
}
</style>

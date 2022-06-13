<template>
  <b-row v-if="unclass" class="justify-content-center">
	<b-col v-for="link in links.account" :key="`${link.path}${accountId}`" sm="6" md="4" lg="2" class="p-0">
		<a
			v-b-tooltip.hover
			:href="`${link.path}${accountId}`"
			target="_blank"
			class="p-3 d-block"
			effect="gray"
			effect-color="i-fifth"
			:title="`${$t('components.account_links.check_account')} ${link.name}`"
		>
			<img class="mr-1" :src="`/img/icons/${link.icon}`" height="35" />
			{{ link.name }}
		</a>
	</b-col>
  </b-row>
  <div v-else class="text-center mt-0 mb-4">
    <a
      v-for="link in links.account"
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
    unclass: {
      type: Boolean,
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
  opacity: 0.5;
}
.account-link img:hover {
  height: 1.3rem;
  width: 1.3rem;
  border-radius: 1.3rem;
  opacity: 1;
}
</style>

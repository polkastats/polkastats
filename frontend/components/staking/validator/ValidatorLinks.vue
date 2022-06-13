<template>
  <b-row v-if="unclass" class="justify-content-center">
	<b-col v-for="link in links.validator" :key="`${link.path}${accountId}`" sm="6" md="4" lg="2" class="p-0">
		<a
			v-b-tooltip.hover
			:href="`${link.path}${accountId}`"
			target="_blank"
			class="p-3 d-block"
			effect="gray"
			effect-color="i-fifth"
			:title="`${$t('components.validator_links.check_validator')} ${link.name}`"
		>
			<img class="mr-1" :src="`/img/icons/${link.icon}`" height="35" />
			{{ link.name }}
		</a>
	</b-col>
  </b-row>
  <div v-else class="mt-0 mb-4">
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

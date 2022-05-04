
<template>
  <article>
	  <header type="block" class="my-3" variant="i-fourth">
		  <h1 class="h5 text-uppercase font-weight-bold">{{ options.title }}</h1>
		  <h2 v-if="options.subtitle">{{ options.subtitle }}</h2>
	  </header>
	  <div>
		<b-table class="pretty-table" :variant="options.variant" v-if="items && items.length > 0" borderless :items="items" :fields="fields">
			<template v-for="(_, slotName) of $scopedSlots" v-slot:[slotName]="scope">
				<slot :name="slotName" v-bind="scope"/>
			</template>
		</b-table>
	  </div>
	  <footer v-if="items && items.length > 0">
		  <nuxt-link v-if="options.link" :to="options.link" :title="options.tooltip">
			  <b>more</b>
			  <font-awesome-icon icon="arrow-right" class="ml-1" />
		  </nuxt-link>
	  </footer>
	  <Loading v-else />
  </article>
</template>

<script>
import Loading from '@/components/Loading.vue'

export default {
	components: [Loading],
	props: ['items', 'fields', 'options'],
}
</script>
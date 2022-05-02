
<template>
  <article>
	  <header type="block" class="my-2">
		  <h1 class="h5 text-uppercase font-weight-bold" variant="i-fourth">{{ options.title }}</h1>
	  </header>
	  <b-table :variant="options.variant" v-if="items && items.length > 0" borderless :items="items" :fields="fields">
		<template v-for="(_, slotName) of $scopedSlots" v-slot:[slotName]="scope">
			<slot :name="slotName" v-bind="scope"/>
		</template>
	  </b-table>
	  <footer v-if="items && items.length > 0">
		  <a :href="options.link">
			  <b>more</b>
			  <font-awesome-icon icon="arrow-right" class="ml-1" />
		  </a>
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
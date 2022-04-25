
<template>
  <article :color="options.color">
	  <header type="block">
		  <h1>{{ options.title }}</h1>
	  </header>
	  <b-table v-if="items && items.length > 0" borderless :items="items" :fields="fields">
		<template v-for="(_, slotName) of $scopedSlots" v-slot:[slotName]="scope">
			<slot :name="slotName" v-bind="scope"/>
		</template>
	  </b-table>
	  <footer v-if="items && items.length > 0">
		  <a :href="options.link" icon="more">more</a>
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

<template>
	<article v-if="options">
		<header v-if="options.title" type="block" class="my-3 text-nowrap" variant="i-fourth">
			<h1 v-if="options.title" class="h5 text-uppercase font-weight-bold">{{ options.title }}</h1>
			<h2 v-if="options.subtitle" class="h6">{{ options.subtitle }}</h2>
		</header>
		<div class="table-wrap">
			<b-table class="pretty-table" v-bind="settings" v-on="listeners" :variant="options.variant" v-if="items && items.length > 0" borderless :items="items" :fields="fields">
				<template v-for="(_, slotName) of $scopedSlots" v-slot:[slotName]="scope">
					<slot :name="slotName" v-bind="scope"/>
				</template>
			</b-table>
		</div>
		<footer v-if="items && items.length > 0">

			<slot name="pagination" v-if="$slots.pagination" />
			<div v-else-if="pagination" class="row text-left">

				<div class="col-6" v-if="pagination.perPage">
					<dropdown-menu size="sm" :variant="pagination.variant || options.variant" :value="{ get name() { return pagination.perPage.num } }">
						<b-dropdown-item v-for="option in pagination.perPage.options" :key="option" @click="pagination.perPage.click(option)">
							{{ option }}
						</b-dropdown-item>
					</dropdown-menu>
				</div>
				
				<b-pagination v-if="pagination.pages"
					class="col-6"
					first-class="mr-2" 
					last-class="ml-2" 
					prev-class="d-none" 
					next-class="d-none" 
					align="right"
					v-model="pagination.pages.current"
					@input="$emit('paginate', pagination.pages.current)"
					:per-page="pagination.pages.perPage"
					:total-rows="pagination.pages.rows"
					:variant="options.variant"
					:hover="pagination.variant || options.variant"
					>
				</b-pagination>
				
			</div>

			<nuxt-link v-if="options.link" :to="options.link" :title="options.tooltip" class="pt-2">
				<!-- TODO: Add translate -->
				<b>more</b>
				<font-awesome-icon icon="arrow-right" class="ml-1" />
			</nuxt-link>

		</footer>
		<Loading v-else />
	</article>
</template>

<script>
import Loading from '@/components/Loading.vue'
import DropdownMenu from '@/components/more/DropdownMenu.vue';

export default {
	components: { Loading, DropdownMenu },
	props: ['items', 'fields', 'options', 'pagination', 'settings', 'listeners'],
}
</script>
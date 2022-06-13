<template>

	<table-component :items="nominations" :fields="fields" :settings="settings" :options="options" :pagination="pagination" @paginate="currentPage = $event" class="text-center">
		<template #cell(who)="data">
            <nuxt-link
              :to="localePath(`/account/${data.item.who}`)"
              :title="$t('pages.accounts.account_details')"
            >
              <Identicon :address="data.item.who" :size="20" class="mr-1" />
              {{ shortAddress(data.item.who) }}
            </nuxt-link>
        </template>
        <template #cell(value)="data">
            {{ formatAmount(data.item.value) }}
        </template>
	</table-component>

  <!-- <div class="nominations">
    <div class="table-responsive">
      <b-table
        striped
        hover
        :fields="fields"
        :items="nominations"
        :per-page="perPage"
        :current-page="currentPage"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
      >
        <template #cell(who)="data">
          <p class="mb-0">
            <nuxt-link
              :to="localePath(`/account/${data.item.who}`)"
              :title="$t('pages.accounts.account_details')"
            >
              <Identicon :address="data.item.who" :size="20" />
              {{ shortAddress(data.item.who) }}
            </nuxt-link>
          </p>
        </template>
        <template #cell(value)="data">
          <p class="mb-0">
            {{ formatAmount(data.item.value) }}
          </p>
        </template>
      </b-table>
      <div class="mt-4 d-flex">
        <b-pagination
          v-model="currentPage"
          :total-rows="totalRows"
          :per-page="perPage"
          aria-controls="my-table"
          variant="dark"
          align="right"
        ></b-pagination>
        <b-button-group class="ml-2">
          <b-button
            v-for="(item, index) in tableOptions"
            :key="index"
            variant="primary2"
            @click="setPageSize(item)"
          >
            {{ item }}
          </b-button>
        </b-button-group>
      </div>
    </div>
  </div> -->
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'
import { paginationOptions } from '@/frontend.config.js'
import TableComponent from '@/components/more/TableComponent.vue'

export default {
  components: {
    Identicon,
	TableComponent
  },
  mixins: [commonMixin],
  props: {
    nominations: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data() {
    return {
      loading: true,
      sortBy: 'value',
      sortDesc: true,
      tableOptions: paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      fields: [
        {
          key: 'who',
          label: this.$t('components.nominations.who'),
		  class: 'text-left'
        },
        {
          key: 'value',
          label: this.$t('components.nominations.value'),
		  class: 'expanded'
        },
      ],
    }
  },
  computed: {
    totalRows() {
      return this.nominations.length
    },
	options()
	{
		return {
			title: this.$t('pages.validator.nominations'),
			variant: 'i-secondary',
		}
	},
	settings()
	{
		return {
			'per-page': this.perPage,
			'current-page': this.currentPage,
			'sort-by.sync': this.sortBy,
			'sort-desc.sync': this.sortDesc,
		}
	},
	pagination()
	{
		return {
			variant: 'i-primary',
			pages:
			{
				current: this.currentPage,
				rows: this.totalRows,
				perPage: this.perPage,
			},
			perPage:
			{
				num: this.perPage,
				click: (option) => this.setPageSize(option),
				options: [10, 20, 50, 100],
			}
		}
	},
  },
  methods: {
    setPageSize(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
}
</script>

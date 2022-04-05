<template>
  <div class="nominations">
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
              :to="`/account/${data.item.who}`"
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
            @click="handleNumFields(item)"
          >
            {{ item }}
          </b-button>
        </b-button-group>
      </div>
    </div>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Identicon,
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
          label: 'Who',
        },
        {
          key: 'value',
          label: 'Value',
        },
      ],
    }
  },
  computed: {
    totalRows() {
      return this.nominations.length
    },
  },
  methods: {
    handleNumFields(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
}
</script>

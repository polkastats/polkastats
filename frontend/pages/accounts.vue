<template>
  <div>
    <section>
      <b-container class="page-accounts main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>
              {{ $t('pages.accounts.active_accounts') }}
              <small v-if="totalRows !== 1" class="ml-1" style="font-size: 1rem"
                >[{{ formatNumber(totalRows) }}]</small
              >
            </h1>
          </b-col>
        </b-row>
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else>
          <!-- Filter -->
          <b-row>
            <b-col lg="12" class="mb-3">
              <b-form-input
                id="filterInput"
                v-model="filter"
                type="search"
                :placeholder="$t('pages.accounts.search_placeholder')"
              />
            </b-col>
          </b-row>
          <!-- Mobile sorting -->
          <div class="row d-block d-sm-block d-md-block d-lg-none d-xl-none">
            <b-col lg="6" class="my-1">
              <b-form-group
                :label="$t('pages.accounts.sort')"
                label-cols-sm="3"
                label-align-sm="right"
                label-size="sm"
                label-for="sortBySelect"
                class="mb-4"
              >
                <b-input-group size="sm">
                  <b-form-select
                    id="sortBySelect"
                    v-model="sortBy"
                    :options="sortOptions"
                    class="w-75"
                  >
                    <template #first>
                      <option value="">-- none --</option>
                    </template>
                  </b-form-select>
                  <b-form-select
                    v-model="sortDesc"
                    size="sm"
                    :disabled="!sortBy"
                    class="w-25"
                  >
                    <option :value="false">Asc</option>
                    <option :value="true">Desc</option>
                  </b-form-select>
                </b-input-group>
              </b-form-group>
            </b-col>
          </div>
          <JsonCSV
            :data="accountsJSON"
            class="download-csv mb-2"
            name="subsocial_accounts.csv"
          >
            <font-awesome-icon icon="file-csv" />
            {{ $t('pages.accounts.download_csv') }}
          </JsonCSV>
          <!-- Table with sorting and pagination-->
          <div>
            <b-table
              id="accounts-table"
              striped
              stacked="md"
              :fields="fields"
              :items="parsedAccounts"
            >
              <template #cell(rank)="data">
                <p class="text-right mb-0">#{{ data.item.rank }}</p>
              </template>
              <template #cell(account_id)="data">
                <div
                  class="
                    d-block d-sm-block d-md-none d-lg-none d-xl-none
                    text-center
                  "
                >
                  <p class="mb-2">
                    {{ $t('pages.accounts.rank') }} #{{ data.item.rank }}
                  </p>
                  <Identicon
                    :key="data.item.account_id"
                    :address="data.item.account_id"
                    :size="40"
                  />
                  <nuxt-link
                    :to="`/account/${data.item.account_id}`"
                    :title="$t('pages.accounts.account_details')"
                  >
                    <h4>{{ shortAddress(data.item.account_id) }}</h4>
                  </nuxt-link>
                  <p v-if="data.item.identity_display" class="mb-0">
                    {{ data.item.identity_display }}
                  </p>
                  <table class="table table-striped mt-4">
                    <tbody>
                      <tr>
                        <td class="text-left">
                          <strong>{{
                            $t('pages.accounts.free_balance')
                          }}</strong>
                        </td>
                        <td class="text-right">
                          {{ formatAmount(data.item.free_balance) }}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-left">
                          <strong>{{
                            $t('pages.accounts.available_balance')
                          }}</strong>
                        </td>
                        <td class="text-right">
                          {{ formatAmount(data.item.available_balance) }}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-left">
                          <strong>{{
                            $t('pages.accounts.locked_balance')
                          }}</strong>
                        </td>
                        <td class="text-right">
                          {{ formatAmount(data.item.locked_balance) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="d-none d-sm-none d-md-block d-lg-block d-xl-block">
                  <Identicon
                    :key="data.item.account_id"
                    :address="data.item.account_id"
                    :size="20"
                  />
                  <nuxt-link
                    v-b-tooltip.hover
                    :to="`/account/${data.item.account_id}`"
                    :title="$t('pages.accounts.account_details')"
                  >
                    {{ shortAddress(data.item.account_id) }}
                  </nuxt-link>
                </div>
              </template>
              <template #cell(free_balance)="data">
                <p class="text-right mb-0">
                  {{ formatAmount(data.item.free_balance) }}
                </p>
              </template>
              <template #cell(locked_balance)="data">
                <p class="text-right mb-0">
                  {{ formatAmount(data.item.locked_balance) }}
                </p>
              </template>
              <template #cell(available_balance)="data">
                <p class="text-right mb-0">
                  {{ formatAmount(data.item.available_balance) }}
                </p>
              </template>
              <template #cell(favorite)="data">
                <p class="text-center mb-0">
                  <a
                    class="favorite"
                    @click="toggleFavorite(data.item.account_id)"
                  >
                    <font-awesome-icon
                      v-if="data.item.favorite"
                      v-b-tooltip.hover
                      icon="star"
                      style="color: #f1bd23; cursor: pointer"
                      :title="$t('pages.accounts.remove_from_favorites')"
                    />
                    <font-awesome-icon
                      v-else
                      v-b-tooltip.hover
                      icon="star"
                      style="color: #e6dfdf; cursor: pointer"
                      :title="$t('pages.accounts.add_to_favorites')"
                    />
                  </a>
                </p>
              </template>
            </b-table>
          </div>
          <!-- pagination -->
          <div class="row">
            <div class="col-6">
              <!-- desktop -->
              <div class="d-none d-sm-none d-md-none d-lg-block d-xl-block">
                <b-button-group>
                  <b-button
                    v-for="(option, index) in paginationOptions"
                    :key="index"
                    :class="{ 'selected-per-page': perPage === option }"
                    variant="outline-secondary"
                    @click="setPageSize(option)"
                  >
                    {{ option }}
                  </b-button>
                </b-button-group>
              </div>
              <!-- mobile -->
              <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
                <b-dropdown
                  class="m-md-2"
                  text="Page size"
                  variant="outline-secondary"
                >
                  <b-dropdown-item
                    v-for="(option, index) in paginationOptions"
                    :key="index"
                    @click="setPageSize(10)"
                  >
                    {{ option }}
                  </b-dropdown-item>
                </b-dropdown>
              </div>
            </div>
            <div class="col-6">
              <b-pagination
                v-model="currentPage"
                :total-rows="totalRows"
                :per-page="perPage"
                aria-controls="my-table"
                variant="dark"
                align="right"
              ></b-pagination>
            </div>
          </div>
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import { gql } from 'graphql-tag'
import JsonCSV from 'vue-json-csv'
import Identicon from '@/components/Identicon.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
    Identicon,
    JsonCSV,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      sortBy: `favorite`,
      sortDesc: true,
      filter: null,
      filterOn: [],
      totalRows: 1,
      agggregateRows: 1,
      fields: [
        {
          key: 'rank',
          label: this.$t('pages.accounts.rank'),
          sortable: true,
          class: `d-none d-sm-none d-md-table-cell d-lg-table-cell d-xl-table-cell`,
        },
        { key: 'account_id', label: 'Account', sortable: true },
        {
          key: 'free_balance',
          label: this.$t('pages.accounts.free_balance'),
          sortable: true,
          class: `d-none d-sm-none d-md-table-cell d-lg-table-cell d-xl-table-cell`,
        },
        {
          key: 'locked_balance',
          label: this.$t('pages.accounts.locked_balance'),
          sortable: true,
          class: `d-none d-sm-none d-md-table-cell d-lg-table-cell d-xl-table-cell`,
        },
        {
          key: 'available_balance',
          label: this.$t('pages.accounts.available_balance'),
          sortable: true,
          class: `d-none d-sm-none d-md-table-cell d-lg-table-cell d-xl-table-cell`,
        },
        {
          key: 'favorite',
          label: '⭐',
          sortable: true,
          class: `d-none d-sm-none d-md-table-cell d-lg-table-cell d-xl-table-cell`,
        },
      ],
      accounts: [],
      favorites: [],
    }
  },
  computed: {
    parsedAccounts() {
      return this.accounts.map((account, index) => {
        return {
          rank: index + 1,
          ...account,
          favorite: this.isFavorite(account.account_id),
        }
      })
    },
    sortOptions() {
      // Create an options list from our fields
      return this.fields
        .filter((f) => f.sortable)
        .map((f) => {
          return { text: f.label, value: f.key }
        })
    },
    accountsJSON() {
      return this.parsedAccounts
    },
  },
  watch: {
    favorites(val) {
      this.$cookies.set('favorites', val, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    },
  },
  created() {
    // get favorites from cookie
    if (this.$cookies.get('favorites')) {
      this.favorites = this.$cookies.get('favorites')
    }
  },
  methods: {
    setPageSize(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
    toggleFavorite(accountId) {
      if (this.favorites.includes(accountId)) {
        this.favorites.splice(this.favorites.indexOf(accountId), 1)
      } else {
        this.favorites.push(accountId)
      }
      return true
    },
    isFavorite(accountId) {
      return this.favorites.includes(accountId)
    },
  },
  apollo: {
    $subscribe: {
      accounts: {
        query: gql`
          query account($accountId: String, $perPage: Int!, $offset: Int!) {
            account(
              limit: $perPage
              offset: $offset
              where: { account_id: { _eq: $accountId } }
              order_by: { free_balance: desc }
            ) {
              account_id
              identity_display
              identity_display_parent
              available_balance
              free_balance
              locked_balance
            }
          }
        `,
        variables() {
          return {
            accountId: this.filter ? this.filter : undefined,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.accounts = data.account
          if (this.filter) {
            this.totalRows = this.accounts.length
          } else {
            this.totalRows = this.agggregateRows
          }
          this.loading = false
        },
      },
      count: {
        query: gql`
          subscription count {
            account_aggregate {
              aggregate {
                count
              }
            }
          }
        `,
        result({ data }) {
          this.agggregateRows = data.account_aggregate.aggregate.count
          if (!this.filter) {
            this.totalRows = this.agggregateRows
          }
        },
      },
    },
  },
}
</script>

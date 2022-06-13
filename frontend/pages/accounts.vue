<template>
	<main>

		<header-component>
			<search-section 
				:title="$t('pages.accounts.active_accounts')" 
				:placeholder="$t('pages.accounts.search_placeholder')"
				:results="formatNumber(totalRows)"
				v-model="filter"
			/>
		</header-component>

		<section class="section">

			<Loading v-if="loading" />
			<table-component v-else :items="parsedAccounts" :fields="fields" :options="options" :pagination="pagination" @paginate="currentPage = $event" class="text-center">

				<template #cell(account_id)="data">
					<Identicon :address="data.item.account_id" />
					<nuxt-link
						v-b-tooltip.hover
						:to="localePath(`/account/${data.item.account_id}`)"
						:title="$t('pages.accounts.account_details')"
					>
						<template v-if="data.item.identity_display_parent">
							{{ data.item.identity_display_parent }}/{{
								data.item.identity_display
							}}
						</template>
						<template v-else-if="data.item.identity_display">
							{{ data.item.identity_display }}
						</template>
						<template v-else>
							{{ shortAddress(data.item.account_id) }}
						</template>
					</nuxt-link>
				</template>
				<template #cell(free_balance)="data">
					{{ formatAmount(data.item.free_balance) }}
				</template>
				<template #cell(locked_balance)="data">
					{{ formatAmount(data.item.locked_balance) }}
				</template>
				<template #cell(available_balance)="data">
					{{ formatAmount(data.item.available_balance) }}
				</template>
				<template #cell(reserved_balance)="data">
					{{ formatAmount(data.item.reserved_balance) }}
				</template>
				<template #cell(total_balance)="data">
					{{ formatAmount(data.item.total_balance) }}
				</template>
				<template #cell(nonce)="data">
					{{ data.item.nonce }}
				</template>

			</table-component>

		</section>

		
  <!-- <div>
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
          Filter
          <b-row>
            <b-col lg="12" class="mb-3">
              <b-input-group size="xl" class="mb-2">
                <b-input-group-prepend is-text>
                  <font-awesome-icon icon="search" />
                </b-input-group-prepend>
                <b-form-input
                  id="filterInput"
                  v-model="filter"
                  type="search"
                  :placeholder="$t('pages.accounts.search_placeholder')"
                />
              </b-input-group>
            </b-col>
          </b-row>
          Table with pagination
          <div>
            <b-table
              id="accounts-table"
              striped
              stacked="md"
              :fields="fields"
              :items="parsedAccounts"
            >
              <template #cell(account_id)="data">
                <div
                  class="
                    d-block d-sm-block d-md-none d-lg-none d-xl-none
                    text-center
                  "
                >
                  <Identicon :address="data.item.account_id" :size="40" />
                  <nuxt-link
                    :to="localePath(`/account/${data.item.account_id}`)"
                    :title="$t('pages.accounts.account_details')"
                  >
                    <h4>
                      <span
                        v-if="data.item.identity_display_parent"
                        class="mb-0"
                      >
                        {{ data.item.identity_display_parent }}/{{
                          data.item.identity_display
                        }}
                      </span>
                      <span v-else-if="data.item.identity_display" class="mb-0">
                        {{ data.item.identity_display }}
                      </span>
                      <span v-else class="mb-0">
                        {{ shortAddress(data.item.account_id) }}
                      </span>
                    </h4>
                  </nuxt-link>
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
                  <Identicon :address="data.item.account_id" :size="20" />
                  <nuxt-link
                    v-b-tooltip.hover
                    :to="localePath(`/account/${data.item.account_id}`)"
                    :title="$t('pages.accounts.account_details')"
                  >
                    <span v-if="data.item.identity_display_parent" class="mb-0">
                      {{ data.item.identity_display_parent }}/{{
                        data.item.identity_display
                      }}
                    </span>
                    <span v-else-if="data.item.identity_display" class="mb-0">
                      {{ data.item.identity_display }}
                    </span>
                    <span v-else class="mb-0">
                      {{ shortAddress(data.item.account_id) }}
                    </span>
                  </nuxt-link>
                </div>
              </template>
              <template #cell(free_balance)="data">
                <p class="mb-0">
                  {{ formatAmount(data.item.free_balance) }}
                </p>
              </template>
              <template #cell(locked_balance)="data">
                <p class="mb-0">
                  {{ formatAmount(data.item.locked_balance) }}
                </p>
              </template>
              <template #cell(available_balance)="data">
                <p class="mb-0">
                  {{ formatAmount(data.item.available_balance) }}
                </p>
              </template>
              <template #cell(reserved_balance)="data">
                <p class="mb-0">
                  {{ formatAmount(data.item.reserved_balance) }}
                </p>
              </template>
              <template #cell(total_balance)="data">
                <p class="mb-0">
                  {{ formatAmount(data.item.total_balance) }}
                </p>
              </template>
              <template #cell(nonce)="data">
                <p class="mb-0">
                  {{ data.item.nonce }}
                </p>
              </template>
            </b-table>
          </div>
          pagination
          <div class="row">
            <div class="col-6">
              desktop
              <div class="d-none d-sm-none d-md-none d-lg-block d-xl-block">
                <b-button-group>
                  <b-button
                    v-for="(option, index) in paginationOptions"
                    :key="index"
                    :class="{ 'selected-per-page': perPage === option }"
                    variant="outline-primary2"
                    @click="setPageSize(option)"
                  >
                    {{ option }}
                  </b-button>
                </b-button-group>
              </div>
              mobile
              <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
                <b-dropdown
                  class="m-md-2"
                  text="Page size"
                  variant="outline-primary2"
                >
                  <b-dropdown-item
                    v-for="(option, index) in paginationOptions"
                    :key="index"
                    @click="setPageSize(option)"
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
  </div> -->

	</main>
	
</template>
<script>
import { gql } from 'graphql-tag'
import Identicon from '@/components/Identicon.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { config, paginationOptions } from '@/frontend.config.js'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import TableComponent from '@/components/more/TableComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'

export default {
  	layout: 'AuthLayout',
  components: {
    Loading,
    Identicon,
	HeaderComponent,
	TableComponent,
	SearchSection,
  },
  mixins: [commonMixin],
  data() {
    return {
		options:
		{
			variant: 'i-fourth',
		},
      loading: true,
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      sortBy: `free_balance`,
      sortDesc: true,
      filter: null,
      filterOn: [],
      totalRows: 1,
      agggregateRows: 1,
	  fields: [
		{
			key: 'account_id',
			label: this.$t('pages.accounts.account'),
			sortable: false,
			variant: 'i-fourth',
			class: 'pkd-separate py-3'
		},
		{
			key: 'free_balance',
			label: this.$t('pages.accounts.free_balance'),
			sortable: false,
		},
		{
			key: 'locked_balance',
			label: this.$t('pages.accounts.locked_balance'),
			sortable: false,
		},
		{
			key: 'available_balance',
			label: this.$t('pages.accounts.available_balance'),
			sortable: false,
		},
		{
			key: 'reserved_balance',
			label: this.$t('pages.accounts.reserved_balance'),
			sortable: false,
		},
		{
			key: 'total_balance',
			label: this.$t('pages.accounts.total_balance'),
			sortable: false,
		},
		{
			key: 'nonce',
			label: 'Nonce',
			sortable: false,
		},
	],
      accounts: [],
      favorites: [],
    }
  },
  head() {
    return {
      title: this.$t('pages.accounts.head_title', {
        networkName: config.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.accounts.head_content', {
            networkName: config.name,
          }),
        },
      ],
    }
  },
  computed:
  {
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
				options: [10, 20, 50, 100 ],
			}
		}
	},
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
  },
  created() {},
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
          query account($filter: String, $perPage: Int!, $offset: Int!) {
            account(
              limit: $perPage
              offset: $offset
              where: {
                _or: [
                  { account_id: { _like: $filter } }
                  { identity_display: { _ilike: $filter } }
                  { identity_display_parent: { _ilike: $filter } }
                ]
              }
              order_by: { total_balance: desc }
            ) {
              account_id
              identity_display
              identity_display_parent
              available_balance
              free_balance
              locked_balance
              reserved_balance
              total_balance
              nonce
            }
          }
        `,
        variables() {
          return {
            filter: this.filter ? `%${this.filter}%` : undefined,
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

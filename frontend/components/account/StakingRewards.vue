<template>

	<div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="stakingRewards.length === 0" class="text-center py-4">
      <h5>{{ $t('components.staking_rewards.no_reward_found') }}</h5>
    </div>
	<div v-else>

		<section class="section section-chart text-center">

			<header class="header-block my-3" size="sm">
				<h1>Rewards</h1>
				<h2>{{ $t('components.staking_rewards_chart.title') }}</h2>
			</header>

      		<StakingRewardsChart :account-id="accountId" />

		</section>

		<section class="section py-4">

			<header class="header-block" variant="transparent">
				<h1 class="h6 mb-2">Search</h1>
				<input-control
					:placeholder="$t('components.staking_rewards.search')"
					icon="search"
					variant="i-primary"
					v-model="filter"
				/>
				<JsonCSV
					class="text-right mt-2"
					:data="stakingRewards"
					:name="`polkastats_staking_rewards_${accountId}.csv`"
				>
					<b-button size="sm" class="font-weight-bold">
						<font-awesome-icon icon="file-csv" class="mr-1" />
						{{ $t('pages.accounts.download_csv') }}
					</b-button>
				</JsonCSV>
			</header>

			<table-component :items="stakingRewards" :fields="fields" :settings="settings" :listeners="listeners" :options="options" :pagination="pagination" @paginate="currentPage = $event" class="text-center">
			
				<template #cell(block_number)="data">
					<nuxt-link
						v-b-tooltip.hover
						:to="localePath(`/block?blockNumber=${data.item.block_number}`)"
						:title="$t('common.block_details')"
					>
						#{{ formatNumber(data.item.block_number) }}
					</nuxt-link>
				</template>
				<template #cell(validator_stash_address)="data">
					<nuxt-link
						v-if="data.item.validator_stash_address"
						:to="
						localePath(`/validator/${data.item.validator_stash_address}`)
						"
						:title="$t('pages.accounts.account_details')"
					>
						<Identicon
						:address="data.item.validator_stash_address"
					/>
						{{ shortAddress(data.item.validator_stash_address) }}
					</nuxt-link>
				</template>
				<template #cell(era)="data">
					{{ data.item.era }}
				</template>
				<template #cell(timestamp)="data">
					<font-awesome-icon icon="calendar-alt" class="mr-1" />
					{{ getDateFromTimestamp(data.item.timestamp) }}
				</template>
				<template #cell(timeago)="data">
					<font-awesome-icon icon="clock" class="mr-1" />
					{{ fromNow(data.item.timestamp) }}
				</template>
				<template #cell(amount)="data">
					{{ formatAmount(data.item.amount, 6) }}
				</template>

			</table-component>
		</section>

	</div>


  <!-- <div class="staking-rewards">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="stakingRewards.length === 0" class="text-center py-4">
      <h5>{{ $t('components.staking_rewards.no_reward_found') }}</h5>
    </div>
    <div v-else>
      <StakingRewardsChart :account-id="accountId" />
      <JsonCSV
        :data="stakingRewards"
        class="download-csv mb-2"
        :name="`polkastats_staking_rewards_${accountId}.csv`"
      >
        <font-awesome-icon icon="file-csv" />
        {{ $t('pages.accounts.download_csv') }}
      </JsonCSV>
      Filter
      <b-row style="margin-bottom: 1rem">
        <b-col cols="12">
          <b-form-input
            id="filterInput"
            v-model="filter"
            type="search"
            :placeholder="$t('components.staking_rewards.search')"
          />
        </b-col>
      </b-row>
      <div class="table-responsive">
        <b-table
          striped
          hover
          :fields="fields"
          :per-page="perPage"
          :current-page="currentPage"
          :items="stakingRewards"
          :filter="filter"
          @filtered="onFiltered"
        >
          <template #cell(block_number)="data">
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="localePath(`/block?blockNumber=${data.item.block_number}`)"
                :title="$t('common.block_details')"
              >
                #{{ formatNumber(data.item.block_number) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(validator_stash_address)="data">
            <p v-if="data.item.validator_stash_address" class="mb-0">
              <nuxt-link
                :to="
                  localePath(`/validator/${data.item.validator_stash_address}`)
                "
                :title="$t('pages.accounts.account_details')"
              >
                <Identicon
                  :address="data.item.validator_stash_address"
                  :size="20"
                />
                {{ shortAddress(data.item.validator_stash_address) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(era)="data">
            <p class="mb-0">
              {{ data.item.era }}
            </p>
          </template>
          <template #cell(timestamp)="data">
            <p class="mb-0">
              {{ getDateFromTimestamp(data.item.timestamp) }}
            </p>
          </template>
          <template #cell(timeago)="data">
            <p class="mb-0">
              {{ fromNow(data.item.timestamp) }}
            </p>
          </template>
          <template #cell(amount)="data">
            <p class="mb-0">
              {{ formatAmount(data.item.amount, 6) }}
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
                variant="outline-primary2"
                :class="{ 'selected-per-page': perPage === option }"
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
    </div>
  </div> -->
</template>

<script>
import { gql } from 'graphql-tag'
import JsonCSV from 'vue-json-csv'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import StakingRewardsChart from '@/components/account/StakingRewardsChart.vue'
import { paginationOptions } from '@/frontend.config.js'
import TableComponent from '@/components/more/TableComponent.vue'
import InputControl from '@/components/more/InputControl.vue'

export default {
  components: {
    Loading,
    JsonCSV,
    StakingRewardsChart,
	TableComponent,
	InputControl
  },
  mixins: [commonMixin],
  props: {
    accountId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      stakingRewards: [],
      filter: null,
      filterOn: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'block_number',
          label: 'Block number',
        //   class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
          sortable: true,
		  variant: 'i-fourth',
		  class: 'pkd-separate'
        },
        {
          key: 'timestamp',
          label: 'Date',
          sortable: true,
        },
        {
          key: 'era',
          label: 'Era',
          sortable: true,
        },
        {
          key: 'validator_stash_address',
          label: 'Validator',
          sortable: true,
		  class: 'text-left'
        },
        {
          key: 'timeago',
          label: 'Time ago',
          sortable: true,
        },
        {
          key: 'amount',
          label: 'Reward',
          sortable: true,
        },
      ],
    }
  },
  computed:
  {
	options()
	{
		return {
			variant: 'i-secondary',
		}
	},
	settings()
	{
		return {
			'per-page': this.perPage,
			'current-page': this.currentPage,
			'filter': this.filter,
		}
	},
	listeners()
	{
		return {
			 filtered: this.onFiltered
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
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length
      this.currentPage = 1
    },
  },
  apollo: {
    $subscribe: {
      staking_rewards: {
        query: gql`
          subscription staking_rewards($accountId: String!) {
            staking_reward(
              order_by: { block_number: desc }
              where: { account_id: { _eq: $accountId } }
            ) {
              block_number
              validator_stash_address
              era
              amount
              timestamp
            }
          }
        `,
        variables() {
          return {
            accountId: this.accountId,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.stakingRewards = data.staking_reward
          this.totalRows = this.stakingRewards.length
          this.$emit('totalRewards', this.totalRows)
          this.loading = false
        },
      },
    },
  },
}
</script>

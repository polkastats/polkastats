<template>
  <div class="staking-rewards">
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
      <!-- Filter -->
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
                :to="`/block?blockNumber=${data.item.block_number}`"
                title="Check block information"
              >
                #{{ formatNumber(data.item.block_number) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(validator_stash_address)="data">
            <p v-if="data.item.validator_stash_address" class="mb-0">
              <nuxt-link
                :to="`/validator/${data.item.validator_stash_address}`"
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
        <div class="mt-4 d-flex">
          <b-pagination
            v-model="currentPage"
            :total-rows="totalRows"
            :per-page="perPage"
            aria-controls="staking-rewards"
          />
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
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import JsonCSV from 'vue-json-csv'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import StakingRewardsChart from '@/components/account/StakingRewardsChart.vue'
import { paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
    JsonCSV,
    StakingRewardsChart,
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
      tableOptions: paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'block_number',
          label: 'Block number',
          class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
          sortable: true,
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
  methods: {
    handleNumFields(num) {
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
          this.loading = false
        },
      },
    },
  },
}
</script>

<template>
  <div>
    <div v-if="loading" class="text-center">
      <Loading />
    </div>
    <div v-else class="ranking">
      <!-- Exclude -->
      <div class="widget mb-4">
        <div class="row">
          <div class="col-10">
            <h5 class="widget-title mb-2">
              <nuxt-link
                v-b-tooltip.hover
                event=""
                to="/"
                title="You can exclude groups of validators based on your preferences"
              >
                <font-awesome-icon
                  icon="question-circle"
                  class="d-inline-block"
                  style="font-size: 1rem"
                />
              </nuxt-link>
              Exclude from search
            </h5>
          </div>
          <div class="col-2 text-right">
            <span v-b-toggle.exclude-filter-collapse class="m-1">
              <font-awesome-icon icon="chevron-up" class="when-open" />
              <font-awesome-icon icon="chevron-down" class="when-closed" />
            </span>
          </div>
        </div>
        <b-collapse id="exclude-filter-collapse" visible>
          <div class="row pt-3">
            <div
              v-for="option in options"
              :key="option.text"
              class="col-md-6 col-lg-3 mb-2"
            >
              <b-form-checkbox
                switch
                size="lg"
                :checked="getExcludeState(option.value)"
                @change="toggleExcluded(option.value)"
              >
                {{ option.text }}
              </b-form-checkbox>
            </div>
          </div>
          <p class="text-center">
            <b-form-checkbox
              switch
              :checked="onlyOneClusterMember"
              @change="toggleOnlyOneClusterMember()"
            >
              Allow only one cluster member
            </b-form-checkbox>
          </p>
        </b-collapse>
      </div>
      <!-- Filter -->
      <b-row>
        <b-col cols="12">
          <b-input-group class="mt-3 mb-4">
            <b-input-group-prepend is-text>
              <font-awesome-icon icon="search" />
            </b-input-group-prepend>
            <b-form-input
              id="filterInput"
              v-model="filter"
              type="search"
              placeholder="Search validator by address or name"
              debounce="500"
            />
          </b-input-group>
        </b-col>
      </b-row>
      <!-- Search results -->
      <b-row>
        <b-col cols="12">
          <p class="mb-2 text-primary2">
            Search results: {{ filteredRows }} / {{ ranking.length }}
          </p>
        </b-col>
      </b-row>
      <!-- Ranking table -->
      <b-table
        hover
        :fields="fields"
        :items="filteredRanking"
        :per-page="perPage"
        :current-page="currentPage"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :filter="filter"
        :filter-included-fields="filterOn"
        :sort-compare="sortCompare"
        :filter-ignored-fields="[
          'active',
          'commission',
          'selfStake',
          'totalStake',
          'relativePerformance',
          'totalRating',
          'selected',
        ]"
        @filtered="onFiltered"
      >
        <template #cell(active)="data">
          <span
            v-if="data.item.active"
            v-b-tooltip.hover
            title="Elected validator"
          >
            <font-awesome-layers class="align-middle">
              <font-awesome-icon icon="circle" class="elected-icon" />
              <font-awesome-icon
                icon="circle"
                class="text-success"
                style="font-size: 1.05rem; margin-left: 0.266rem"
                transform="shrink-6"
              />
            </font-awesome-layers>
          </span>
          <span v-else v-b-tooltip.hover title="Not elected validator">
            <font-awesome-layers>
              <font-awesome-icon icon="circle" class="not-elected-icon" />
              <font-awesome-icon
                icon="circle"
                class="text-danger"
                style="font-size: 1.05rem; margin-left: 0.266rem"
                transform="shrink-6"
              />
            </font-awesome-layers>
          </span>
        </template>
        <template #cell(name)="data">
          <!-- desktop -->
          <div class="d-none d-sm-none d-md-none d-lg-block d-xl-block">
            <Identicon :address="data.item.stashAddress" :size="24" />
            <nuxt-link :to="`/validator/${data.item.stashAddress}`">
              <span v-if="data.item.name">{{ data.item.name }}</span>
              <span v-else>{{ shortAddress(data.item.stashAddress) }}</span>
            </nuxt-link>
            <VerifiedIcon v-if="data.item.verifiedIdentity" />
          </div>
          <!-- mobile -->
          <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
            <b-row>
              <b-col cols="10">
                <Identicon :address="data.item.stashAddress" :size="24" />
                <nuxt-link :to="`/validator/${data.item.stashAddress}`">
                  <span v-if="data.item.name">{{ data.item.name }}</span>
                  <span v-else>{{ shortAddress(data.item.stashAddress) }}</span>
                </nuxt-link>
                <VerifiedIcon v-if="data.item.verifiedIdentity" />
              </b-col>
              <b-col cols="2">
                <a
                  v-b-tooltip.hover
                  @click="toggleSelected(data.item.stashAddress)"
                >
                  <font-awesome-icon
                    v-if="data.item.selected"
                    icon="star"
                    style="color: #f1bd23; cursor: pointer"
                    class="favorite"
                    :title="$t('pages.accounts.remove_from_favorites')"
                  />
                  <font-awesome-icon
                    v-else
                    icon="star"
                    style="color: #e6dfdf; cursor: pointer"
                    class="favorite"
                    :title="$t('pages.accounts.add_to_favorites')"
                  />
                </a>
              </b-col>
            </b-row>
          </div>
        </template>
        <template #cell(commission)="data">
          {{ data.item.commission.toFixed(1) }}%
        </template>

        <template #cell(selfStake)="data">
          {{ formatAmount(data.item.selfStake) }}
        </template>
        <template #cell(otherStake)="data">
          {{ formatAmount(data.item.otherStake) }}
        </template>
        <template #cell(relativePerformance)="data">
          <b-progress
            v-b-tooltip.hover
            :max="100"
            show-progress
            :title="`${(data.item.relativePerformance * 100).toFixed(2)} %`"
          >
            <b-progress-bar
              :value="data.item.relativePerformance * 100"
              :label="`${(data.item.relativePerformance * 100).toFixed(2)} %`"
            ></b-progress-bar>
          </b-progress>
        </template>
        <template #cell(totalRating)="data">
          <span
            v-b-tooltip.hover
            :title="`
              Active: ${data.item.activeRating},
              Subaccounts: ${data.item.subAccountsRating},
              Identity: ${data.item.identityRating},
              Address: ${data.item.addressCreationRating},
              Nominators: ${data.item.nominatorsRating},
              Commission: ${data.item.commissionRating},
              EraPoints: ${data.item.eraPointsRating},
              Slash: ${data.item.slashRating},
              Governance: ${data.item.governanceRating},
              Payouts: ${data.item.payoutRating}
            `"
            >{{ data.item.totalRating }}</span
          >
        </template>
        <template #cell(selected)="data">
          <p class="text-center mb-0">
            <a
              v-b-tooltip.hover
              class="favorite"
              @click="toggleSelected(data.item.stashAddress)"
            >
              <font-awesome-icon
                v-if="data.item.selected"
                icon="star"
                style="color: #f1bd23; cursor: pointer"
                :title="$t('pages.accounts.remove_from_favorites')"
              />
              <font-awesome-icon
                v-else
                icon="star"
                style="color: #e6dfdf; cursor: pointer"
                :title="$t('pages.accounts.add_to_favorites')"
              />
            </a>
          </p>
        </template>
      </b-table>
      <div class="row">
        <div class="col-6">
          <!-- desktop -->
          <div class="d-none d-sm-none d-md-none d-lg-block d-xl-block">
            <b-button-group>
              <b-button
                variant="outline-primary2"
                :class="{ 'selected-per-page': perPage === 10 }"
                @click="setPageSize(10)"
                >10</b-button
              >
              <b-button
                variant="outline-primary2"
                :class="{ 'selected-per-page': perPage === 50 }"
                @click="setPageSize(50)"
                >50</b-button
              >
              <b-button
                variant="outline-primary2"
                :class="{ 'selected-per-page': perPage === 100 }"
                @click="setPageSize(100)"
                >100</b-button
              >
              <b-button
                variant="outline-primary2"
                :class="{ 'selected-per-page': perPage === 1000 }"
                @click="setPageSize(1000)"
                >All</b-button
              >
            </b-button-group>
          </div>
          <!-- mobile -->
          <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
            <b-dropdown
              class="m-md-2"
              text="Page size"
              variant="outline-primary2"
            >
              <b-dropdown-item @click="setPageSize(10)">10</b-dropdown-item>
              <b-dropdown-item @click="setPageSize(50)">50</b-dropdown-item>
              <b-dropdown-item @click="setPageSize(100)">100</b-dropdown-item>
              <b-dropdown-item @click="setPageSize(1000)">All</b-dropdown-item>
            </b-dropdown>
          </div>
        </div>
        <div class="col-6">
          <b-pagination
            v-model="currentPage"
            :total-rows="filteredRows"
            :per-page="perPage"
            aria-controls="my-table"
            variant="dark"
            align="right"
          ></b-pagination>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { BigNumber } from 'bignumber.js'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      perPage: 10,
      currentPage: 1,
      sortBy: 'rank',
      sortDesc: false,
      fields: [
        {
          key: 'active',
          label: 'Elected',
          sortable: true,
          class:
            'text-center d-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
        },
        { key: 'name', sortable: true },
        {
          key: 'relativePerformance',
          label: 'R. Performance',
          sortable: true,
          class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
        },
        {
          key: 'selfStake',
          sortable: true,
          class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
        },
        {
          key: 'activeEras',
          sortable: true,
          class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
        },
        {
          key: 'customVRCScore',
          label: 'Score',
          sortable: true,
          class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
        },
        {
          key: 'selected',
          label: 'Favorites',
          sortable: true,
          class:
            'text-center d-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
        },
      ],
      exclude: [],
      options: [
        { text: 'Not elected', value: 'inactive' },
        { text: '100% commission', value: 'greedy' },
        { text: 'Slashed', value: 'slashed' },
        { text: 'Oversubscribed', value: 'oversubscribed' },
        { text: 'No identity', value: 'noIdentity' },
        { text: 'No verified identity', value: 'noVerifiedIdentity' },
        {
          text: 'Below average era points',
          value: 'belowAverageEraPoints',
        },
        {
          text: 'Cluster member excess',
          value: 'partOfCluster',
        },
      ],
      filter: null,
      filterOn: [],
      rows: 0,
      maxValidatorsReached: false,
      polling: null,
      autoFilter: false,
      onlyOneClusterMember: true,
    }
  },
  computed: {
    loading() {
      return this.$store.state.ranking.loading
    },
    ranking() {
      return this.$store.state.ranking.list
    },
    selectedValidatorAddresses() {
      return this.$store.state.ranking.selectedAddresses
    },
    selectedValidators() {
      return this.ranking.filter(({ stashAddress }) =>
        this.$store.state.ranking.selectedAddresses.includes(stashAddress)
      )
    },
    filteredRanking() {
      let filteredRanking = this.exclude.includes('inactive')
        ? this.ranking.filter(({ active }) => active)
        : this.ranking
      filteredRanking = this.exclude.includes('greedy')
        ? filteredRanking.filter(({ commission }) => commission !== 100)
        : filteredRanking
      filteredRanking = this.exclude.includes('noIdentity')
        ? filteredRanking.filter(({ name }) => name !== '')
        : filteredRanking
      filteredRanking = this.exclude.includes('noVerifiedIdentity')
        ? filteredRanking.filter(({ verifiedIdentity }) => verifiedIdentity)
        : filteredRanking
      filteredRanking = this.exclude.includes('noAutoPayout')
        ? filteredRanking.filter(({ payoutRating }) => payoutRating === 3)
        : filteredRanking
      filteredRanking = this.exclude.includes('noParticipateGovernance')
        ? filteredRanking.filter(
            ({ governanceRating }) => governanceRating !== 0
          )
        : filteredRanking
      filteredRanking = this.exclude.includes('belowAverageEraPoints')
        ? filteredRanking.filter(({ eraPointsRating }) => eraPointsRating === 2)
        : filteredRanking
      filteredRanking = this.exclude.includes('partOfCluster')
        ? filteredRanking.filter(({ showClusterMember }) => showClusterMember)
        : filteredRanking
      // pareto-dominance auto-filter
      filteredRanking = this.autoFilter
        ? filteredRanking.filter(({ dominated }) => !dominated)
        : filteredRanking
      return filteredRanking
    },
    filteredRows() {
      return this.filter ? this.rows : this.filteredRanking.length
    },
  },
  watch: {
    exclude(exclude) {
      this.$cookies.set(`${network.name}-exclude`, exclude, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    },
  },
  methods: {
    setPageSize(size) {
      this.perPage = size
    },
    isSelected(accountId) {
      return this.selectedValidatorAddresses.includes(accountId)
    },
    toggleSelected(accountId) {
      this.$store.dispatch('ranking/toggleSelected', { accountId })
    },
    toggleExcluded(value) {
      if (this.exclude.includes(value)) {
        this.exclude.splice(this.exclude.indexOf(value), 1)
      } else {
        this.exclude.push(value)
      }
    },
    getExcludeState(value) {
      if (this.exclude.includes(value)) {
        return true
      }
      return false
    },
    onFiltered(filteredItems) {
      this.rows = filteredItems.length
      this.currentPage = 1
      // update cookie
      this.$cookies.set(`${network.name}-filter`, this.filter, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    },
    sortCompare(aRow, bRow, key) {
      const a = aRow[key]
      const b = bRow[key]
      if (a instanceof BigNumber && b instanceof BigNumber) {
        return a.lt(b) ? -1 : 1
      } else if (typeof a === 'number' && typeof b === 'number') {
        return a < b ? -1 : 1
      }
      return a.toString().localeCompare(b.toString())
    },
    toggleAutoFilter() {
      this.autoFilter = !this.autoFilter
    },
    toggleOnlyOneClusterMember() {
      this.onlyOneClusterMember = !this.onlyOneClusterMember
      this.$store.dispatch(
        'ranking/toggleOnlyOneClusterMember',
        JSON.parse(JSON.stringify(this.onlyOneClusterMember))
      )
    },
  },
}
</script>

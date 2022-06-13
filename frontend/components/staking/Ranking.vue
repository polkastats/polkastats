<template>

	<main>

		<header-component>
			
			<search-section 
				:title="$t('pages.validators.title')" 
				:placeholder="$t('components.ranking.search_placeholder')"
				:results="filteredRows + ' / ' + ranking.length"
				v-model="filter"
			>
				<header class="my-3">
					<h1 class="mb-2 h6">
						{{ $t('components.ranking.exclude_from_search') }}
						<nuxt-link
							class="ml-1"
							v-b-tooltip.hover
							to="/help#exclude-filter"
							:title="$t('components.ranking.exclude_description')"
						>
							<font-awesome-icon icon="question-circle" />
						</nuxt-link>
					</h1>
					<p>
						<b-form-checkbox
							variant="i-fourth"
							active="i-fifth"
							size="sm"
							switch
							:checked="onlyOneClusterMember"
							@change="toggleOnlyOneClusterMember()"
						>
							{{ $t('components.ranking.allow_only_one_cluster_member') }}
						</b-form-checkbox>
					</p>
				</header>
				<b-row class="text-left">
					<b-col sm="6" md="4" lg="3" xl="2" v-for="option in options" :key="option.text">
						<b-form-checkbox
							variant="i-fourth"
							active="i-fifth"
							size="sm"
							switch
							:checked="getExcludeState(option.value)"
							@change="toggleExcluded(option.value)"
						>
							{{ option.text }}
						</b-form-checkbox>
					</b-col>
				</b-row>
			</search-section>

		</header-component>

		<section class="section">

			<Loading v-if="loading" />
			<table-component v-else :items="filteredRanking" :fields="fields" :settings="settings" :listeners="listeners" :options="tableOptions" :pagination="pagination" @paginate="currentPage = $event" class="text-center">
				<template #cell(active)="data">
					<small
						style="filter: blur(0.5px)"
						effect="blur"
						variant="i-success"
						v-if="data.item.active"
						v-b-tooltip.hover
						:title="$t('components.ranking.elected_validator')"
					>
						<font-awesome-icon icon="circle" />
					</small>
					<small
						style="filter: blur(0.5px)"
						effect="blur"
						variant="i-danger"
						v-else
						v-b-tooltip.hover
						:title="$t('components.ranking.not_elected_validator')"
					>
						<font-awesome-icon icon="circle" />
					</small>
				</template>
				<template #cell(name)="data">
					<Identicon :address="data.item.stashAddress" :size="20" />
					<nuxt-link :to="localePath(`/validator/${data.item.stashAddress}`)">
						<span v-if="data.item.name">{{ data.item.name }}</span>
						<span v-else>{{ shortAddress(data.item.stashAddress) }}</span>
					</nuxt-link>
					<VerifiedIcon v-if="data.item.verifiedIdentity" :unclass="true" />
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
					<div class="text-left small">
						{{ (data.item.relativePerformance * 100).toFixed(2) }} %
					</div>
					<b-progress
						v-if="data.item.relativePerformance >= 0.25 && data.item.relativePerformance < 0.75"
						:max="100"
						height="2px"
						variant="warning"
						:value="data.item.relativePerformance * 100"
					/>
					<b-progress
						v-else-if="data.item.relativePerformance >= 0.75"
						:max="100"
						height="2px"
						variant="i-success"
						:value="data.item.relativePerformance * 100"
					/>
					<b-progress
						v-else
						:max="100"
						height="2px"
						variant="i-danger"
						:value="data.item.relativePerformance * 100"
					/>
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
						>
							{{ data.item.totalRating }}
						</span>
				</template>
				<template #cell(selected)="data">
					<span @click="toggleSelected(data.item.stashAddress)">
						<b-form-checkbox
							variant="i-light"
							active="i-success"
							disabled
							size="sm"
							switch
							v-b-tooltip.hover
							:title="$t('components.ranking.select_unselect')"
							:checked="data.item.selected"
						/>
					</span>
				</template>
			</table-component>

		</section>
	</main>

  <!-- <div>
    <div v-if="loading" class="text-center">
      <Loading />
    </div>
    <div v-else class="ranking">
      Exclude
      <div class="widget mb-4">
        <div class="row">
          <div class="col-10">
            <h5 class="widget-title mb-2">
              <nuxt-link
                v-b-tooltip.hover
                to="/help#exclude-filter"
                :title="$t('components.ranking.exclude_description')"
              >
                <font-awesome-icon
                  icon="question-circle"
                  class="d-inline-block"
                  style="font-size: 1rem"
                />
              </nuxt-link>
              {{ $t('components.ranking.exclude_from_search') }}
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
              {{ $t('components.ranking.allow_only_one_cluster_member') }}
            </b-form-checkbox>
          </p>
        </b-collapse>
      </div>
      Filter
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
              :placeholder="$t('components.ranking.search_placeholder')"
              debounce="500"
            />
          </b-input-group>
        </b-col>
      </b-row>
      Search results
      <b-row>
        <b-col cols="12">
          <p class="mb-2 text-primary2">
            {{ $t('components.ranking.search_results') }}: {{ filteredRows }} /
            {{ ranking.length }}
          </p>
        </b-col>
      </b-row>
      Ranking table
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
            :title="$t('components.ranking.elected_validator')"
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
          <span
            v-else
            v-b-tooltip.hover
            :title="$t('components.ranking.not_elected_validator')"
          >
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
          desktop
          <div class="d-none d-sm-none d-md-none d-lg-block d-xl-block">
            <Identicon :address="data.item.stashAddress" :size="24" />
            <nuxt-link :to="localePath(`/validator/${data.item.stashAddress}`)">
              <span v-if="data.item.name">{{ data.item.name }}</span>
              <span v-else>{{ shortAddress(data.item.stashAddress) }}</span>
            </nuxt-link>
            <VerifiedIcon v-if="data.item.verifiedIdentity" />
          </div>
          mobile
          <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
            <b-row>
              <b-col cols="10">
                <Identicon :address="data.item.stashAddress" :size="24" />
                <nuxt-link
                  :to="localePath(`/validator/${data.item.stashAddress}`)"
                >
                  <span v-if="data.item.name">{{ data.item.name }}</span>
                  <span v-else>{{ shortAddress(data.item.stashAddress) }}</span>
                </nuxt-link>
                <VerifiedIcon v-if="data.item.verifiedIdentity" />
              </b-col>
              <b-col cols="2">
                <a
                  v-b-tooltip.hover
                  class="select"
                  title="Select / Unselect validator"
                  @click="toggleSelected(data.item.stashAddress)"
                >
                  <font-awesome-icon
                    v-if="data.item.selected"
                    icon="check-square"
                    class="selected text-selected"
                  />
                  <font-awesome-icon
                    v-else
                    icon="square"
                    class="unselected text-secondary"
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
              class="select"
              :title="$t('components.ranking.select_unselect')"
              @click="toggleSelected(data.item.stashAddress)"
            >
              <font-awesome-icon
                v-if="data.item.selected"
                icon="check-square"
                class="selected text-success"
              />
              <font-awesome-icon
                v-else
                icon="square"
                class="unselected text-light"
              />
            </a>
          </p>
        </template>
      </b-table>
      <div class="row">
        <div class="col-6">
          desktop
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
                :class="{ 'selected-per-page': perPage === 10000 }"
                @click="setPageSize(10000)"
                >{{ $t('components.ranking.all') }}</b-button
              >
            </b-button-group>
          </div>
          mobile
          <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
            <b-dropdown
              class="m-md-2"
              text="Page size"
              variant="outline-primary2"
            >
              <b-dropdown-item @click="setPageSize(10)">10</b-dropdown-item>
              <b-dropdown-item @click="setPageSize(50)">50</b-dropdown-item>
              <b-dropdown-item @click="setPageSize(100)">100</b-dropdown-item>
              <b-dropdown-item @click="setPageSize(10000)">{{
                $t('components.ranking.all')
              }}</b-dropdown-item>
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
  </div> -->
</template>

<script>
import { BigNumber } from 'bignumber.js'
import commonMixin from '@/mixins/commonMixin.js'
import { config } from '@/frontend.config.js'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import TableComponent from '@/components/more/TableComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'
import DropdownMenu from '@/components/more/DropdownMenu.vue';
import InputControl from '@/components/more/InputControl.vue'

export default {
	components:
	{
		HeaderComponent,
		TableComponent,
		SearchSection,
		DropdownMenu,
		InputControl
	},
  mixins: [commonMixin],
  data() {
    return {
		tableOptions:
		{
			variant: 'i-fourth',
		},
      perPage: 10,
      currentPage: 1,
      sortBy: 'rank',
      sortDesc: false,
      fields: [
        {
          key: 'active',
          label: this.$t('components.ranking.elected'),
          sortable: true,
        },
        {
          key: 'name',
          label: this.$t('components.ranking.name'),
          sortable: true,
		  class: "text-left"
        },
        {
          key: 'relativePerformance',
          label: this.$t('components.ranking.relative_performance'),
          sortable: true,
        },
        {
          key: 'selfStake',
          label: this.$t('components.ranking.self_stake'),
          sortable: true,
        },
        {
          key: 'activeEras',
          label: this.$t('components.ranking.active_eras'),
          sortable: true,
        },
        {
          key: 'customVRCScore',
          label: this.$t('components.ranking.score'),
          sortable: true,
        },
        {
          key: 'selected',
          label: this.$t('components.ranking.selected'),
          sortable: true,
        },
      ],
      exclude: [],
      options: [
        { text: this.$t('components.ranking.inactive'), value: 'inactive' },
        { text: this.$t('components.ranking.greedy'), value: 'greedy' },
        { text: this.$t('components.ranking.slashed'), value: 'slashed' },
        {
          text: this.$t('components.ranking.oversubscribed'),
          value: 'oversubscribed',
        },
        {
          text: this.$t('components.ranking.no_identity'),
          value: 'noIdentity',
        },
        {
          text: this.$t('components.ranking.no_verified_identity'),
          value: 'noVerifiedIdentity',
        },
        {
          text: this.$t('components.ranking.no_auto_payout'),
          value: 'noAutoPayout',
        },
        {
          text: this.$t('components.ranking.below_average_era_points'),
          value: 'belowAverageEraPoints',
        },
        {
          text: this.$t('components.ranking.no_participate_governance'),
          value: 'noParticipateGovernance',
        },
        {
          text: this.$t('components.ranking.part_of_cluster'),
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
	settings()
	{
		return {
			'per-page': this.perPage,
			'current-page': this.currentPage,
			'sort-by.sync': this.sortBy,
			'sort-desc.sync': this.sortDesc,
			'filter': this.filter,
			'filter-included-fields': this.filterOn,
			'sort-compare': this.sortCompare,
			'filter-ignored-fields': [
				'active',
				'commission',
				'selfStake',
				'totalStake',
				'relativePerformance',
				'totalRating',
				'selected',
			]
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
				rows: this.filteredRows,
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
      this.$cookies.set(`${config.name}-exclude`, exclude, {
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
      this.$cookies.set(`${config.name}-filter`, this.filter, {
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

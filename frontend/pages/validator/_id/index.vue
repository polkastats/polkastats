<template>

	<main>
		<section v-if="loading || !validator" class="section text-center py-4">
			<Loading />
		</section>
		<template v-else>
			<header-component>
				<search-section variant="i-gradient-third" image="avatar" image-size="auto">

						<template #header>

								<p>
									<b-button
										v-if="validator.includedThousandValidators"
										:href="`https://thousand-validators.kusama.network/#/leaderboard/${accountId}`"
										target="_blank"
										variant="i-fourth"
										size="sm"
										class="mx-2 mb-3"
									>
										1KV Program
									</b-button>
									<SelectedValidators v-if="config.showValSelectorInPage" variant="i-primary" class="mb-3" />
								</p>
								
								<h2 class="h4">
									<Identicon :address="accountId" :size="50" p-relative>
										<VerifiedIcon v-if="validator.verifiedIdentity" :unclass="true" class="m-n2" size="md" p-absolute="top-right" />
									</Identicon>
								</h2>
								
								<h1 class="h4 mt-2">
									<template v-if="validator.name">
										{{ validator.name }}
									</template>
									<template v-else>
										{{ shortAddress(accountId) }}
									</template>
								</h1>
								<b-form-checkbox
									v-b-tooltip.hover
									title="Select / Unselect validator"
									class="mt-2"
									variant="i-fifth"
									active="i-success"
									size="sm"
									switch
									:checked="isSelected(validator.stashAddress)"
									@change="toggleSelected(validator.stashAddress)"
								/>
								
						</template>
			  
				</search-section>
				<section class="section text-left text-nowrap text-uppercase text-i-fifth font-weight-600" color="i-fourthB">
					<ValidatorLinks :account-id="accountId" :unclass="true" />
				</section>

				<template #sections>
					<section class="section" color="i-third-1">

						<!-- TODO: Translate -->
						<header class="header-block mb-4" size="sm">
							<h1>Specs</h1>
							<h2 class="text-i-fourth">Important validator account data</h2>
						</header>
						
						<section class="text-i-fifth overflow-hidden small">
							<spec-item v-if="validator.stashAddress" :title="$t('details.validator.stash')">
								<div class="fee">
									<Identicon :address="validator.stashAddress" :size="20" class="mr-1" />
									<nuxt-link :to="localePath(`/account/${validator.stashAddress}`)">
										{{ shortAddress(validator.stashAddress) }}
									</nuxt-link>
								</div>
							</spec-item>
							<spec-item v-if="validator.controllerAddress" :title="$t('details.validator.controller')">
								<div class="fee">
									<Identicon :address="validator.controllerAddress" :size="20" class="mr-1" />
									<nuxt-link :to="localePath(`/account/${validator.controllerAddress}`)">
										{{ shortAddress(validator.controllerAddress) }}
									</nuxt-link>
								</div>
							</spec-item>
							<!-- identity start -->
							<spec-item v-if="validator.identity.email" :title="$t('details.validator.email')">
								<div class="fee">
									<a :href="`mailto:${validator.identity.email}`" target="_blank">
										{{ validator.identity.email }}
									</a>
								</div>
							</spec-item>
							<spec-item v-if="validator.identity.legal" :title="$t('details.validator.legal')">
								<div class="fee">
									{{ validator.identity.legal }}
								</div>
							</spec-item>
							<spec-item v-if="validator.identity.riot" :title="$t('details.validator.riot')">
								<div class="fee">
									<a :href="`https://riot.im/app/#/user/${validator.identity.riot}`" target="_blank">
										{{ validator.identity.riot }}
									</a>
								</div>
							</spec-item>
							<spec-item v-if="validator.identity.twitter" title="Twitter">
								<div class="fee">
									<a :href="`https://twitter.com/${validator.identity.twitter}`" target="_blank">
										{{ validator.identity.twitter }}
									</a>
								</div>
							</spec-item>
							<spec-item v-if="validator.identity.web" title="Web">
								<div class="fee">
									<a :href="validator.identity.web" target="_blank">
										{{ validator.identity.web }}
									</a>
								</div>
							</spec-item>
							<!-- identity end -->
						</section>

					</section>
				</template>

			</header-component>

			<section class="section section-tabs">

				<b-tabs active-nav-item-class="text-i-primary" align="center">
					<b-tab active>
						<template #title>
							<h6>{{ $t('pages.validator.metrics') }}</h6>
						</template>

						<header class="header-block my-3" size="sm">
							<h1>{{ $t('pages.validator.metrics') }}</h1>
						</header>

						<b-alert
							show
							dismissible
							fade
							variant="i-fourth"
							class="bg-i-fourth text-i-fifth text-center py-3"
						>
							{{ $t('pages.validator.metrics_description', { networkName: config.name }) }}
						</b-alert>

						<section class="section-rating" align="center">
							<b-row class="align-items-stretch">
								<b-col md="6">
									<Identity
										:identity="validator.identity"
										:rating="validator.identityRating"
									/>
								</b-col>
								<b-col md="6">
									<Address
										:account-id="validator.stashAddress"
										:identity="validator.identity"
										:rating="validator.addressCreationRating"
										:created-at-block="validator.stashAddressCreationBlock"
										:parent-created-at-block="
										validator.stashParentAddressCreationBlock
										"
									/>
								</b-col>
							</b-row>
							<b-row>
								<b-col md="6">
									<Slashes
										:slashes="validator.slashes"
										:rating="validator.slashRating"
									/>
								</b-col>
								<b-col md="6">
									<Subaccounts
										:rating="validator.subAccountsRating"
										:cluster-members="validator.clusterMembers"
									/>
								</b-col>
							</b-row>
							<b-row>
								<b-col md="6">
									<Nominators
										:nominators="validator.nominators"
										:rating="validator.nominatorsRating"
									/>
								</b-col>
								<b-col md="6">
									<EraPoints
										:percent="validator.eraPointsPercent"
										:average="eraPointsAveragePercent"
										:era-points-history="validator.eraPointsHistory"
										:rating="validator.eraPointsRating"
									/>
								</b-col>
							</b-row>
							<b-row>
								<b-col md="6">
									<Commission
										:commission="validator.commission"
										:commission-history="validator.commissionHistory"
										:rating="validator.commissionRating"
									/>
								</b-col>
								<b-col md="6">
									<Payouts
										:payout-history="validator.payoutHistory"
										:rating="validator.payoutRating"
									/>
								</b-col>
							</b-row>
							<b-row>
								<b-col md="6">
									<Governance
										:council-backing="validator.councilBacking"
										:active="validator.activeInGovernance"
										:rating="validator.governanceRating"
									/>
								</b-col>
								<b-col md="6">
									<Thousand
										v-if="validator.includedThousandValidators"
										:account-id="validator.stashAddress"
										:thousand="validator.thousandValidator"
									/>
								</b-col>
							</b-row>
						</section>

					</b-tab>
					<b-tab>
						<template #title>
							<h6>{{ $t('pages.validator.charts') }}</h6>
						</template>

						<header class="header-block my-3" size="sm">
							<h1>{{ $t('pages.validator.charts') }}</h1>
						</header>
						<b-row>
							<b-col xl="6">
								<header class="header-block my-4" size="sm" variant="transparent">
									<h1>{{ $t('components.relative_performance_chart.title') }}</h1>
								</header>
								<RelativePerformanceChart
									style="height: 25em;"
									:relative-performance-history="
									validator.relativePerformanceHistory"
								/>
							</b-col>
							<b-col xl="6">
								<header class="header-block my-4" size="sm" variant="transparent">
									<h1>{{ $t('components.era_points_chart.title') }}</h1>
								</header>
								<EraPointsChart style="height: 25em;" :era-points-history="validator.eraPointsHistory" />
							</b-col>
							<b-col cols="12">
								<header class="header-block my-4" size="sm" variant="transparent">
									<h1>{{ $t('components.payouts_chart.title') }}</h1>
								</header>
								<PayoutsChart style="height: 25em;" :payout-history="validator.payoutHistory" />
							</b-col>
							<b-col xl="6">
								<header class="header-block my-4" size="sm" variant="transparent">
									<h1>{{ $t('components.stake_chart.title', { tokenSymbol: config.tokenSymbol }) }}</h1>
								</header>
								<StakeChart style="height: 25em;" :stake-history="validator.stakeHistory" />
							</b-col>
							<b-col xl="6">
								<header class="header-block my-4" size="sm" variant="transparent">
									<h1>{{ $t('components.commission_chart.title') }}</h1>
								</header>
								<CommissionChart style="height: 25em;" :commission-history="validator.commissionHistory" />
							</b-col>
						</b-row>

					</b-tab>
					<b-tab>
						<template #title>
							<h6>{{ $t('pages.validator.nominations') }}</h6>
						</template>

						<Nominations :nominations="validator.nominations" />
					</b-tab>
				</b-tabs>

			</section>

		</template>

	</main>


  <!-- <div class="page validator-page container pt-3">
    <div v-if="loading || !validator">
      <Loading />
    </div>
    <div v-else>
      <b-row v-if="config.showValSelectorInPage">
        <b-col offset="9" cols="3">
          <b-dropdown
            id="selected-validators"
            ref="selectedValidators"
            class="selected-validators"
            toggle-class="btn btn-block btn-selected mb-3"
            right
          >
            <template #button-content>
              <span v-if="loading">{{
                capitalize($t('pages.validator.selected'))
              }}</span>
              <span v-else>
                {{ selectedValidatorAddresses.length }}/{{
                  config.validatorSetSize
                }}
                {{ $t('pages.validator.selected') }}
              </span>
              <font-awesome-icon icon="hand-paper" />
            </template>
            <SelectedValidators />
          </b-dropdown>
        </b-col>
      </b-row>
      <div class="row">
        <div class="col-10">
          <h1 class="mt-3">
            <Identicon :address="accountId" :size="64" />
            <span v-if="validator.name">
              {{ validator.name }}
              <verified-icon v-if="validator.verifiedIdentity" size="lg" />
            </span>
            <span v-else>
              {{ shortAddress(accountId) }}
            </span>
          </h1>
          <h4 v-if="validator.includedThousandValidators">
            <a
              :href="`https://thousand-validators.kusama.network/#/leaderboard/${accountId}`"
              target="_blank"
              class="badge badge-pill badge-info"
              >1KV Program</a
            >
          </h4>
          <p><ValidatorLinks :account-id="accountId" /></p>
        </div>
        <div class="col-2 text-right mt-4">
          <a
            v-b-tooltip.hover
            class="select"
            title="Select / Unselect validator"
            @click="toggleSelected(validator.stashAddress)"
          >
            <font-awesome-icon
              v-if="isSelected(validator.stashAddress)"
              icon="check-square"
              class="selected fa-2x text-success"
            />
            <font-awesome-icon
              v-else
              icon="square"
              class="unselected fa-2x text-light"
            />
          </a>
        </div>
      </div>
      <b-card class="mb-4">
        <div v-if="validator.stashAddress" class="row">
          <div class="col-md-3 mb-1">
            <strong>{{ $t('details.validator.stash') }}</strong>
          </div>
          <div class="col-md-9 mb-1 fee">
            <Identicon :address="validator.stashAddress" :size="20" />
            <nuxt-link :to="localePath(`/account/${validator.stashAddress}`)">
              {{ shortAddress(validator.stashAddress) }}
            </nuxt-link>
          </div>
        </div>
        <div v-if="validator.controllerAddress" class="row">
          <div class="col-md-3 mb-1">
            <strong>{{ $t('details.validator.controller') }}</strong>
          </div>
          <div class="col-md-9 mb-1 fee">
            <Identicon :address="validator.controllerAddress" :size="20" />
            <nuxt-link
              :to="localePath(`/account/${validator.controllerAddress}`)"
            >
              {{ shortAddress(validator.controllerAddress) }}
            </nuxt-link>
          </div>
        </div>
        identity start
        <div v-if="validator.identity.email" class="row">
          <div class="col-md-3 mb-2">
            <strong>{{ $t('details.validator.email') }}</strong>
          </div>
          <div class="col-md-9 mb-2 fee">
            <a :href="`mailto:${validator.identity.email}`" target="_blank">
              {{ validator.identity.email }}
            </a>
          </div>
        </div>
        <div v-if="validator.identity.legal" class="row">
          <div class="col-md-3 mb-2">
            <strong>{{ $t('details.validator.legal') }}</strong>
          </div>
          <div class="col-md-9 mb-2 fee">
            {{ validator.identity.legal }}
          </div>
        </div>
        <div v-if="validator.identity.riot" class="row">
          <div class="col-md-3 mb-2">
            <strong>{{ $t('details.validator.riot') }}</strong>
          </div>
          <div class="col-md-9 mb-2 fee">
            <a
              :href="`https://riot.im/app/#/user/${validator.identity.riot}`"
              target="_blank"
            >
              {{ validator.identity.riot }}
            </a>
          </div>
        </div>
        <div v-if="validator.identity.twitter" class="row">
          <div class="col-md-3 mb-2">
            <strong>Twitter</strong>
          </div>
          <div class="col-md-9 mb-2 fee">
            <a
              :href="`https://twitter.com/${validator.identity.twitter}`"
              target="_blank"
            >
              {{ validator.identity.twitter }}
            </a>
          </div>
        </div>
        <div v-if="validator.identity.web" class="row">
          <div class="col-md-3 mb-2">
            <strong>Web</strong>
          </div>
          <div class="col-md-9 mb-2 fee">
            <a :href="validator.identity.web" target="_blank">
              {{ validator.identity.web }}
            </a>
          </div>
        </div>
        identity end
      </b-card>
      <b-tabs content-class="py-4">
        <b-tab :title="$t('pages.validator.metrics')" active>
          <b-alert
            show
            dismissible
            variant="info"
            class="text-center py-3 glitch"
          >
            {{
              $t('pages.validator.metrics_description', {
                networkName: config.name,
              })
            }}
          </b-alert>
          <div class="row pt-4">
            <div class="col-md-6 mb-5">
              <Identity
                :identity="validator.identity"
                :rating="validator.identityRating"
              />
            </div>
            <div class="col-md-6 mb-5">
              <Address
                :account-id="validator.stashAddress"
                :identity="validator.identity"
                :rating="validator.addressCreationRating"
                :created-at-block="validator.stashAddressCreationBlock"
                :parent-created-at-block="
                  validator.stashParentAddressCreationBlock
                "
              />
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-5">
              <Slashes
                :slashes="validator.slashes"
                :rating="validator.slashRating"
              />
            </div>
            <div class="col-md-6 mb-5">
              <Subaccounts
                :rating="validator.subAccountsRating"
                :cluster-members="validator.clusterMembers"
              />
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-5">
              <Nominators
                :nominators="validator.nominators"
                :rating="validator.nominatorsRating"
              />
            </div>
            <div class="col-md-6 mb-5">
              <EraPoints
                :percent="validator.eraPointsPercent"
                :average="eraPointsAveragePercent"
                :era-points-history="validator.eraPointsHistory"
                :rating="validator.eraPointsRating"
              />
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-5">
              <Commission
                :commission="validator.commission"
                :commission-history="validator.commissionHistory"
                :rating="validator.commissionRating"
              />
            </div>
            <div class="col-md-6 mb-5">
              <Payouts
                :payout-history="validator.payoutHistory"
                :rating="validator.payoutRating"
              />
            </div>
          </div>
          <div class="row">
            <div class="col-md-6 mb-5">
              <Governance
                :council-backing="validator.councilBacking"
                :active="validator.activeInGovernance"
                :rating="validator.governanceRating"
              />
            </div>
            <div class="col-md-6 mb-5">
              <Thousand
                v-if="validator.includedThousandValidators"
                :account-id="validator.stashAddress"
                :thousand="validator.thousandValidator"
              />
            </div>
          </div>
        </b-tab>
        <b-tab :title="$t('pages.validator.charts')">
          <div class="row">
            <div class="col-xl-6 pb-4">
              <RelativePerformanceChart
                :relative-performance-history="
                  validator.relativePerformanceHistory
                "
              />
            </div>
            <div class="col-xl-6 pb-4">
              <EraPointsChart
                :era-points-history="validator.eraPointsHistory"
              />
            </div>
          </div>
          <div class="row">
            <div class="col-xl-6 pb-4">
              <PayoutsChart :payout-history="validator.payoutHistory" />
            </div>
            <div class="col-xl-6 pb-4">
              <StakeChart :stake-history="validator.stakeHistory" />
            </div>
          </div>
          <div class="row">
            <div class="col-xl-6 pb-4">
              <CommissionChart
                :commission-history="validator.commissionHistory"
              />
            </div>
            <div class="col-xl-6 pb-4"></div>
          </div>
        </b-tab>
        <b-tab :title="$t('pages.validator.nominations')">
          <Nominations :nominations="validator.nominations" />
        </b-tab>
      </b-tabs>
    </div>
  </div> -->
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import SelectedValidators from '@/components/staking/SelectedValidators.vue'
import Identity from '@/components/staking/validator/metrics/Identity.vue'
import Address from '@/components/staking/validator/metrics/Address.vue'
import Slashes from '@/components/staking/validator/metrics/Slashes.vue'
import Subaccounts from '@/components/staking/validator/metrics/Subaccounts.vue'
import Nominators from '@/components/staking/validator/metrics/Nominators.vue'
import EraPoints from '@/components/staking/validator/metrics/EraPoints.vue'
import Commission from '@/components/staking/validator/metrics/Commission.vue'
import Payouts from '@/components/staking/validator/metrics/Payouts.vue'
import Governance from '@/components/staking/validator/metrics/Governance.vue'
import Thousand from '@/components/staking/validator/metrics/Thousand.vue'
import RelativePerformanceChart from '@/components/staking/validator/charts/RelativePerformanceChart.vue'
import EraPointsChart from '@/components/staking/validator/charts/EraPointsChart.vue'
import PayoutsChart from '@/components/staking/validator/charts/PayoutsChart.vue'
import StakeChart from '@/components/staking/validator/charts/StakeChart.vue'
import CommissionChart from '@/components/staking/validator/charts/CommissionChart.vue'
import Nominations from '@/components/staking/validator/Nominations.vue'
import ValidatorLinks from '@/components/staking/validator/ValidatorLinks.vue'
import { config } from '@/frontend.config.js'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'
import SpecItem from '@/components/more/SpecItem.vue'

export default {
	layout: 'AuthLayout',
  components: {
    SelectedValidators,
    Identity,
    Address,
    Slashes,
    Subaccounts,
    Nominators,
    EraPoints,
    Commission,
    Payouts,
    Governance,
    Thousand,
    RelativePerformanceChart,
    EraPointsChart,
    PayoutsChart,
    StakeChart,
    CommissionChart,
    Nominations,
    ValidatorLinks,
	HeaderComponent,
	SearchSection,
	SpecItem
  },
  mixins: [commonMixin],
  data() {
    return {
      config,
      accountId: this.$route.params.id,
      polling: null,
      validator: null,
      blockHeight: null,
    }
  },
  head() {
    return {
      title: this.$t('pages.validator.head_title', {
        networkName: config.name,
        address: this.accountId,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.validator.head_content', {
            networkName: config.name,
            address: this.accountId,
          }),
        },
      ],
    }
  },
  computed: {
    loading() {
      return this.$store.state.ranking.loading
    },
    selectedValidatorAddresses() {
      return this.$store.state.ranking.selectedAddresses
    },
    eraPointsAveragePercent() {
      return this.$store.state.ranking.eraPointsAverage
    },
  },
  methods: {
    isSelected(accountId) {
      return this.selectedValidatorAddresses.includes(accountId)
    },
    toggleSelected(accountId) {
      this.$store.dispatch('ranking/toggleSelected', { accountId })
    },
  },
  apollo: {
    $subscribe: {
      validator: {
        query: gql`
          subscription validator($stashAddress: String) {
            ranking(
              where: { stash_address: { _eq: $stashAddress } }
              order_by: { block_height: asc }
              limit: 1
            ) {
              active
              active_eras
              active_in_governance
              active_rating
              address_creation_rating
              cluster_members
              cluster_name
              commission
              commission_history
              commission_rating
              controller_address
              council_backing
              era_points_history
              era_points_percent
              era_points_rating
              governance_rating
              has_sub_identity
              identity
              identity_rating
              included_thousand_validators
              name
              nominators
              nominators_rating
              nominations
              other_stake
              part_of_cluster
              payout_history
              payout_rating
              performance
              rank
              relative_performance
              relative_performance_history
              self_stake
              stake_history
              slash_rating
              slashed
              slashes
              stash_address
              stash_address_creation_block
              stash_parent_address_creation_block
              sub_accounts_rating
              thousand_validator
              total_rating
              total_stake
              verified_identity
            }
          }
        `,
        variables() {
          return {
            stashAddress: this.accountId,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          const validator = data.ranking[0]
          this.validator = {
            active: validator.active,
            activeEras: validator.active_eras,
            activeInGovernance: validator.active_in_governance,
            activeRating: validator.active_rating,
            addressCreationRating: validator.address_creation_rating,
            clusterMembers: parseInt(validator.cluster_members),
            clusterName: validator.cluster_name,
            commission: parseFloat(validator.commission),
            commissionHistory: JSON.parse(validator.commission_history),
            commissionRating: validator.commission_rating,
            controllerAddress: validator.controller_address,
            councilBacking: validator.council_backing,
            eraPointsHistory: JSON.parse(validator.era_points_history),
            eraPointsPercent: parseFloat(validator.era_points_percent),
            eraPointsRating: validator.era_points_rating,
            governanceRating: validator.governance_rating,
            hasSubIdentity: validator.has_sub_identity,
            identity: JSON.parse(validator.identity),
            identityRating: validator.identity_rating,
            includedThousandValidators: validator.included_thousand_validators,
            name: validator.name,
            nominators: validator.nominators,
            nominatorsRating: validator.nominators_rating,
            nominations: JSON.parse(validator.nominations),
            otherStake: validator.other_stake,
            partOfCluster: validator.part_of_cluster,
            payoutHistory: JSON.parse(validator.payout_history),
            payoutRating: validator.payout_rating,
            performance: parseFloat(validator.performance),
            rank: validator.rank,
            relativePerformance: parseFloat(validator.relative_performance),
            relativePerformanceHistory: JSON.parse(
              validator.relative_performance_history
            ),
            selfStake: validator.self_stake,
            stakeHistory: JSON.parse(validator.stake_history),
            slashRating: validator.slash_rating,
            slashed: validator.slashed,
            slashes: JSON.parse(validator.slashes),
            stashAddress: validator.stash_address,
            stashAddressCreationBlock: validator.stash_address_creation_block,
            stashParentAddressCreationBlock:
              validator.stash_parent_address_creation_block,
            subAccountsRating: validator.sub_accounts_rating,
            thousandValidator: JSON.parse(validator.thousand_validator),
            totalRating: validator.total_rating,
            totalStake: validator.total_stake,
            verifiedIdentity: validator.verified_identity,
            selected: this.isSelected(validator.stashAddress),
          }
        },
      },
    },
  },
}
</script>

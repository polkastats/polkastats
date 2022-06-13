<template>

	<main>
		<section v-if="loading" class="section text-center py-4">
			<Loading />
		</section>
		<section v-else-if="!parsedAccount" class="section text-center">
			<h1>Account not found!</h1>
		</section>
		<template v-else>
			<header-component>
				<search-section variant="i-gradient-third" image="avatar" image-size="auto">

						<template #header>
								<Identicon :address="parsedAccount.accountId" class="mt-4" :size="50" />
								<h1 class="h4 mt-2">
									<span v-if="parsedAccount.identity.display && parsedAccount.identity.displayParent">
										{{ parsedAccount.identity.displayParent }} /
										{{ parsedAccount.identity.display }}
									</span>
									<span v-else-if="parsedAccount.identity.display">
										{{ parsedAccount.identity.display }}
									</span>
									<span v-else>
										{{ shortAddress(parsedAccount.accountId) }}
									</span>
								</h1>
								<h2 class="h6 font-weight-normal">
									{{ formatAmount(parsedAccount.totalBalance, 3, true) }}
								</h2>
						</template>
			  
				</search-section>
				<section class="section text-left text-nowrap text-uppercase text-i-fifth font-weight-600" color="i-fourthB">
					<AccountLinks :account-id="accountId" :unclass="true" />
				</section>

				<template #sections>
					<BalanceChart :account-id="accountId" />
				</template>

			</header-component>
			
			<!-- <BalanceChart :account-id="accountId" /> -->
			<section class="section" color="i-third-1">

				<!-- TODO: Translate -->
				<header class="header-block mb-4" size="sm">
					<h1>Specs</h1>
					<h2 class="text-i-fourth">Important account data</h2>
				</header>

				<section class="text-i-fifth overflow-hidden small">

					<spec-item :title="$t('details.account.account_id')">
						<Identicon class="mr-1" :address="parsedAccount.accountId" />
						{{ parsedAccount.accountId }}
					</spec-item>
					<spec-item v-if="parsedAccount.identity.display" title="Identity::display">
						<template v-if="parsedAccount.identity.display && parsedAccount.identity.displayParent">
							{{ parsedAccount.identity.displayParent }} / {{ parsedAccount.identity.display }}
						</template>
						<template v-else>
							{{ parsedAccount.identity.display }}
						</template>
					</spec-item>
					<spec-item v-if="parsedAccount.identity.email" title="Identity::email">
						<a :href="`mailto:${parsedAccount.identity.email}`" target="_blank">
							{{ parsedAccount.identity.email }}
						</a>
					</spec-item>
					<spec-item v-if="parsedAccount.identity.legal" title="Identity::legal">
						{{ parsedAccount.identity.legal }}
					</spec-item>
					<spec-item v-if="parsedAccount.identity.riot" title="Identity::riot">
						{{ parsedAccount.identity.riot }}
					</spec-item>
					<spec-item v-if="parsedAccount.identity.web" title="Identity::web">
						<a :href="parsedAccount.identity.web" target="_blank">
							{{ parsedAccount.identity.web }}
						</a>
					</spec-item>
					<spec-item v-if="parsedAccount.identity.twitter" title="Identity::twitter">
						<a :href="`https://twitter.com/${parsedAccount.identity.twitter.substr(1, parsedAccount.identity.twitter.length)}`" target="_blank">
							{{ parsedAccount.identity.twitter }}
						</a>
					</spec-item>
					<spec-item v-if="parsedAccount.identity.judgements" title="Identity::judgements">
						<template v-if="parsedAccount.identity.judgements.length > 0">
							{{ parsedAccount.identity.judgements }}
						</template>
						<span>No</span>
					</spec-item>
					<spec-item :title="$t('details.account.account_nonce')">
						{{ parsedAccount.nonce }}
					</spec-item>
					<spec-item :title=" $t('details.account.total_balance')" :multi="true">
						<spec-item>
							{{ formatAmount(parsedAccount.totalBalance, 3, true) }}
						</spec-item>
						<spec-item variant="i-primary" sm="2">
							<FIATConversion variant="i-fourth" :units="parsedAccount.totalBalance" />
						</spec-item>
					</spec-item>
					<spec-item :title="$t('details.account.free_balance')" :multi="true">
						<spec-item>
							{{ formatAmount(parsedAccount.balances.freeBalance, 3, true) }}
						</spec-item>
						<spec-item variant="i-primary" sm="2">
							<FIATConversion variant="i-fourth" :units="parsedAccount.freeBalance" />
						</spec-item>
					</spec-item>
					<spec-item :title="$t('details.account.available_balance')" :multi="true">
						<spec-item>
							{{ formatAmount(parsedAccount.balances.availableBalance, 3, true) }}
						</spec-item>
						<spec-item variant="i-primary" sm="2">
							<FIATConversion variant="i-fourth" :units="parsedAccount.availableBalance" />
						</spec-item>
					</spec-item>
					<spec-item :title="$t('details.account.locked_balance')" :multi="true">
						<spec-item>
							{{ formatAmount(parsedAccount.balances.lockedBalance, 3, true) }}
						</spec-item>
						<spec-item variant="i-primary" sm="2">
							<FIATConversion variant="i-fourth" :units="parsedAccount.lockedBalance" />
						</spec-item>
					</spec-item>
					<spec-item :title="$t('details.account.reserved_balance')" :multi="true">
						<spec-item>
							{{ formatAmount(parsedAccount.balances.reservedBalance, 3, true) }}
						</spec-item>
						<spec-item variant="i-primary" sm="2">
							<FIATConversion variant="i-fourth" :units="parsedAccount.reservedBalance" />
						</spec-item>
					</spec-item>
					<spec-item :title="$t('details.account.is_vesting')">
						{{ parsedAccount.balances.isVesting ? `Yes` : `No` }}
					</spec-item>
					<spec-item :title="$t('details.account.vested_balance')" :multi="true">
						<spec-item>
							{{ formatAmount(parsedAccount.balances.vestedBalance, 3, true) }}
						</spec-item>
						<spec-item variant="i-primary" sm="2">
							<FIATConversion variant="i-fourth" :units="parsedAccount.balances.vestedBalance" />
						</spec-item>
					</spec-item>
					<spec-item :title="$t('details.account.vesting_total')" :multi="true">
						<spec-item>
							{{ formatAmount(parsedAccount.balances.vestingTotal, 3, true)}}
						</spec-item>
						<spec-item variant="i-primary" sm="2">
							<FIATConversion variant="i-fourth" :units="parsedAccount.balances.vestingTotal" />
						</spec-item>
					</spec-item>
					<spec-item :title="$t('details.account.voting_balance')" :multi="true">
						<spec-item>
							{{ formatAmount(parsedAccount.balances.votingBalance, 3, true) }}
						</spec-item>
						<spec-item variant="i-primary" sm="2">
							<FIATConversion variant="i-fourth" :units="parsedAccount.balances.votingBalance" />
						</spec-item>
					</spec-item>

				</section>

			</section>

			<section class="section section-tabs" color="i-fifth-1">

				<b-tabs active-nav-item-class="text-i-primary" align="center">
					<b-tab active>
						<template #title>
							<h6>
								Extrinsics
								<b-badge v-if="totalExtrinsics" variant="i-third-25" class="ml-1 text-xs">{{ totalExtrinsics }}</b-badge>
							</h6>
						</template>
						<Extrinsics
							:account-id="accountId"
							@totalExtrinsics="onTotalExtrinsics"
						/>
					</b-tab>
					<b-tab>
						<template #title>
							<h6>
								Transfers
								<b-badge v-if="totalTransfers" variant="i-third-25" class="ml-1 text-xs">{{ totalTransfers }}</b-badge>
							</h6>
						</template>
						<AccountTransfers
							:account-id="accountId"
							@totalTransfers="onTotalTransfers"
						/>
					</b-tab>
					<b-tab>
						<template #title>
							<h6>
								Rewards
								<b-badge v-if="totalRewards" variant="i-third-25" class="ml-1 text-xs">{{ totalRewards }}</b-badge>
							</h6>
						</template>
						<StakingRewards
							:account-id="accountId"
							@totalRewards="onTotalRewards"
						/>
					</b-tab>
					<b-tab>
						<template #title>
							<h6>
								Slashes
								<b-badge v-if="totalSlashes" variant="i-third-25" class="ml-1 text-xs">{{ totalSlashes }}</b-badge>
							</h6>
						</template>
						<StakingSlashes
							:account-id="accountId"
							@totalSlashes="onTotalSlashes"
						/>
					</b-tab>
			</b-tabs>

			</section>

		</template>
	</main>


  <!-- <div>
    <section>
      <b-container class="account-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!parsedAccount">
          <h1 class="text-center">Account not found!</h1>
        </template>
        <template v-else>
          <div class="card mb-4">
            <div class="card-body">
              <p class="text-center mb-2">
                <Identicon :address="parsedAccount.accountId" :size="80" />
              </p>
              <h4 class="text-center mb-4">
                <span
                  v-if="
                    parsedAccount.identity.display &&
                    parsedAccount.identity.displayParent
                  "
                >
                  {{ parsedAccount.identity.displayParent }} /
                  {{ parsedAccount.identity.display }}
                </span>
                <span v-else-if="parsedAccount.identity.display">
                  {{ parsedAccount.identity.display }}
                </span>
                <span v-else>
                  {{ shortAddress(parsedAccount.accountId) }}
                </span>
              </h4>
              <h4 class="text-center mb-4 amount">
                {{ formatAmount(parsedAccount.totalBalance, 3, true) }}
              </h4>
              <AccountLinks :account-id="accountId" />
              <BalanceChart :account-id="accountId" />
              <div class="table-responsive pb-4">
                <table class="table table-striped">
                  <tbody>
                    <tr>
                      <td>{{ $t('details.account.account_id') }}</td>
                      <td class="text-right">
                        <Identicon
                          :address="parsedAccount.accountId"
                          :size="20"
                        />
                        <span>{{ parsedAccount.accountId }}</span>
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.display">
                      <td>Identity::display</td>
                      <td class="text-right">
                        <span
                          v-if="
                            parsedAccount.identity.display &&
                            parsedAccount.identity.displayParent
                          "
                        >
                          {{ parsedAccount.identity.displayParent }} /
                          {{ parsedAccount.identity.display }}
                        </span>
                        <span v-else>
                          {{ parsedAccount.identity.display }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.email">
                      <td>Identity::email</td>
                      <td class="text-right">
                        <a
                          :href="`mailto:${parsedAccount.identity.email}`"
                          target="_blank"
                          >{{ parsedAccount.identity.email }}</a
                        >
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.legal">
                      <td>Identity::legal</td>
                      <td class="text-right">
                        {{ parsedAccount.identity.legal }}
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.riot">
                      <td>Identity::riot</td>
                      <td class="text-right">
                        {{ parsedAccount.identity.riot }}
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.web">
                      <td>Identity::web</td>
                      <td class="text-right">
                        <a :href="parsedAccount.identity.web" target="_blank">{{
                          parsedAccount.identity.web
                        }}</a>
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.twitter">
                      <td>Identity::twitter</td>
                      <td class="text-right">
                        <a
                          :href="`https://twitter.com/${parsedAccount.identity.twitter.substr(
                            1,
                            parsedAccount.identity.twitter.length
                          )}`"
                          target="_blank"
                          >{{ parsedAccount.identity.twitter }}</a
                        >
                      </td>
                    </tr>
                    <tr v-if="parsedAccount.identity.judgements">
                      <td>Identity::judgements</td>
                      <td class="text-right">
                        <span
                          v-if="parsedAccount.identity.judgements.length > 0"
                        >
                          {{ parsedAccount.identity.judgements }}
                        </span>
                        <span> No </span>
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.account_nonce') }}</td>
                      <td class="text-right">
                        {{ parsedAccount.nonce }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.total_balance') }}</td>
                      <td class="text-right">
                        <span class="amount">{{
                          formatAmount(parsedAccount.totalBalance, 3, true)
                        }}</span>
                        <FIATConversion :units="parsedAccount.totalBalance" />
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.free_balance') }}</td>
                      <td class="text-right">
                        <span class="amount">{{
                          formatAmount(
                            parsedAccount.balances.freeBalance,
                            3,
                            true
                          )
                        }}</span>
                        <FIATConversion :units="parsedAccount.freeBalance" />
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.available_balance') }}</td>
                      <td class="text-right">
                        <span class="amount">{{
                          formatAmount(
                            parsedAccount.balances.availableBalance,
                            3,
                            true
                          )
                        }}</span>
                        <FIATConversion
                          :units="parsedAccount.availableBalance"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.locked_balance') }}</td>
                      <td class="text-right">
                        <span class="amount">{{
                          formatAmount(
                            parsedAccount.balances.lockedBalance,
                            3,
                            true
                          )
                        }}</span>
                        <FIATConversion :units="parsedAccount.lockedBalance" />
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.reserved_balance') }}</td>
                      <td class="text-right">
                        <span class="amount">{{
                          formatAmount(
                            parsedAccount.balances.reservedBalance,
                            3,
                            true
                          )
                        }}</span>
                        <FIATConversion
                          :units="parsedAccount.reservedBalance"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.is_vesting') }}</td>
                      <td class="text-right">
                        {{ parsedAccount.balances.isVesting ? `Yes` : `No` }}
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.vested_balance') }}</td>
                      <td class="text-right amount">
                        <span class="amount">{{
                          formatAmount(
                            parsedAccount.balances.vestedBalance,
                            3,
                            true
                          )
                        }}</span>
                        <FIATConversion
                          :units="parsedAccount.balances.vestedBalance"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.vesting_total') }}</td>
                      <td class="text-right">
                        <span class="amount">{{
                          formatAmount(
                            parsedAccount.balances.vestingTotal,
                            3,
                            true
                          )
                        }}</span>
                        <FIATConversion
                          :units="parsedAccount.balances.vestingTotal"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>{{ $t('details.account.voting_balance') }}</td>
                      <td class="text-right">
                        <span class="amount">{{
                          formatAmount(
                            parsedAccount.balances.votingBalance,
                            3,
                            true
                          )
                        }}</span>
                        <FIATConversion
                          :units="parsedAccount.balances.votingBalance"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <b-tabs class="mt-4" content-class="mt-4" fill>
                <b-tab active>
                  <template #title>
                    <h5 class="d-inline-block">Extrinsics</h5>
                    <span v-if="totalExtrinsics">[{{ totalExtrinsics }}]</span>
                  </template>
                  <Extrinsics
                    :account-id="accountId"
                    @totalExtrinsics="onTotalExtrinsics"
                  />
                </b-tab>
                <b-tab>
                  <template #title>
                    <h5 class="d-inline-block">Transfers</h5>
                    <span v-if="totalTransfers">[{{ totalTransfers }}]</span>
                  </template>
                  <AccountTransfers
                    :account-id="accountId"
                    @totalTransfers="onTotalTransfers"
                  />
                </b-tab>
                <b-tab>
                  <template #title>
                    <h5 class="d-inline-block">Rewards</h5>
                    <span v-if="totalRewards">[{{ totalRewards }}]</span>
                  </template>
                  <StakingRewards
                    :account-id="accountId"
                    @totalRewards="onTotalRewards"
                  />
                </b-tab>
                <b-tab>
                  <template #title>
                    <h5 class="d-inline-block">Slashes</h5>
                    <span v-if="totalSlashes">[{{ totalSlashes }}]</span>
                  </template>
                  <StakingSlashes
                    :account-id="accountId"
                    @totalSlashes="onTotalSlashes"
                  />
                </b-tab>
              </b-tabs>
            </div>
          </div>
        </template>
      </b-container>
    </section>
  </div> -->
</template>
<script>
import { gql } from 'graphql-tag'
import Identicon from '@/components/Identicon.vue'
import Loading from '@/components/Loading.vue'
import Extrinsics from '@/components/account/Extrinsics.vue'
import AccountTransfers from '@/components/account/AccountTransfers.vue'
import StakingRewards from '@/components/account/StakingRewards.vue'
import StakingSlashes from '@/components/account/StakingSlashes.vue'
import BalanceChart from '@/components/account/BalanceChart.vue'
import AccountLinks from '@/components/account/AccountLinks.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { config } from '@/frontend.config.js'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'
import SpecItem from '@/components/more/SpecItem.vue'

export default {
	layout: 'AuthLayout',
  components: {
    Identicon,
    Loading,
    Extrinsics,
    AccountTransfers,
    StakingRewards,
    StakingSlashes,
    BalanceChart,
    AccountLinks,
	HeaderComponent,
	SearchSection,
	SpecItem
  },
  mixins: [commonMixin],
  data() {
    return {
      config,
      loading: true,
      accountId: this.$route.params.id,
      parsedAccount: undefined,
      transfers: [],
      fields: [
        {
          key: 'block_number',
          label: 'Block number',
          class: 'd-none d-sm-none d-md-none d-lg-block d-xl-block',
          sortable: true,
        },
        {
          key: 'from',
          label: 'From',
          sortable: true,
        },
        {
          key: 'to',
          label: 'To',
          sortable: true,
        },
        {
          key: 'amount',
          label: 'Amount',
          sortable: true,
        },
      ],
      totalExtrinsics: undefined,
      totalTransfers: undefined,
      totalRewards: undefined,
      totalSlashes: undefined,
    }
  },
  head() {
    return {
      title: this.$t('pages.account.head_title', {
        networkName: config.name,
        address: this.accountId,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.account.head_content', {
            networkName: config.name,
            address: this.accountId,
          }),
        },
      ],
    }
  },
  watch: {
    $route() {
      this.accountId = this.$route.params.id
    },
  },
  methods: {
    onTotalExtrinsics(value) {
      this.totalExtrinsics = value
    },
    onTotalTransfers(value) {
      this.totalTransfers = value
    },
    onTotalRewards(value) {
      this.totalRewards = value
    },
    onTotalSlashes(value) {
      this.totalSlashes = value
    },
  },
  apollo: {
    $subscribe: {
      account: {
        query: gql`
          subscription account($account_id: String!) {
            account(where: { account_id: { _eq: $account_id } }) {
              account_id
              balances
              available_balance
              free_balance
              locked_balance
              reserved_balance
              total_balance
              nonce
              block_height
              identity
              timestamp
            }
          }
        `,
        variables() {
          return {
            account_id: this.accountId,
          }
        },
        result({ data }) {
          if (data.account[0]) {
            this.parsedAccount = {
              accountId: data.account[0].account_id,
              availableBalance: data.account[0].available_balance,
              freeBalance: data.account[0].free_balance,
              lockedBalance: data.account[0].locked_balance,
              reservedBalance: data.account[0].reserved_balance,
              totalBalance: data.account[0].total_balance,
              balances: JSON.parse(data.account[0].balances),
              nonce: data.account[0].nonce,
              identity:
                data.account[0].identity !== ``
                  ? JSON.parse(data.account[0].identity)
                  : {},
              timestamp: data.account[0].timestamp,
            }
          } else if (this.isAddress(this.accountId)) {
            this.parsedAccount = {
              accountId: this.accountId,
              availableBalance: '0',
              freeBalance: '0',
              lockedBalance: '0',
              reservedBalance: '0',
              totalBalance: '0',
              balances: {
                accountId: this.accountId,
                accountNonce: '0x00000000',
                additional: [],
                freeBalance: '0x00000000000000000000000000000000',
                frozenFee: '0x00000000000000000000000000000000',
                frozenMisc: '0x00000000000000000000000000000000',
                reservedBalance: '0x00000000000000000000000000000000',
                votingBalance: '0x00000000000000000000000000000000',
                availableBalance: '0x00000000000000000000000000000000',
                lockedBalance: '0x00000000000000000000000000000000',
                lockedBreakdown: [],
                vestingLocked: '0x00000000000000000000000000000000',
                isVesting: false,
                vestedBalance: '0x00000000000000000000000000000000',
                vestedClaimable: '0x00000000000000000000000000000000',
                vestingEndBlock: '0x00000000',
                vestingPerBlock: '0x00000000000000000000000000000000',
                vestingTotal: '0x00000000000000000000000000000000',
              },
              nonce: 0,
              identity: {},
              timestamp: null,
            }
          }
          this.loading = false
        },
      },
    },
  },
}
</script>

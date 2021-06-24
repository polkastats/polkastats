import { BigNumber } from 'bignumber.js'
import { gql } from 'graphql-tag'
import { BToast } from 'bootstrap-vue'
import { network } from '@/frontend.config.js'

export const state = () => ({
  list: [],
  eraHistory: [],
  blockHeight: 0,
  eraPointsHistoryTotalsSum: 0,
  eraPointsAverage: 0,
  loading: true,
  chainValidatorAddresses: [], // on-chain validator set
  selectedAddresses: [], // selected validators
  selectedAddress: undefined, // connected stash address
  metricWeights: {
    active: 1,
    commission: 1,
    eraPoints: 1,
    governance: 1,
    identity: 1,
    nominators: 1,
    address: 1,
    payout: 1,
    slashes: 1,
    subaccounts: 1,
  },
  customVRCScoreEnabled: false,
  onlyOneClusterMember: true,
})

export const getters = {
  getMetricWeights: (state) => state.metricWeights,
  getSelectedAddresses: (state) => state.selectedAddresses,
}

export const mutations = {
  updateList(state, { ranking, blockHeight, eraPointsAverage, loading }) {
    state.list = ranking
    state.blockHeight = blockHeight
    state.eraPointsAverage = eraPointsAverage
    state.loading = loading
  },
  updateSelectedAddress(state, selectedAddress) {
    state.selectedAddress = selectedAddress
  },
  loadSelected(state) {
    const selectedAddresses =
      this.$cookies.get(`${network.name}-selectedValidatorAddresses`) || []
    state.selectedAddresses = selectedAddresses
  },
  toggleSelected(state, { accountId }) {
    const selectedAddresses = state.selectedAddresses
    if (selectedAddresses.includes(accountId)) {
      selectedAddresses.splice(state.selectedAddresses.indexOf(accountId), 1)
      const validator = state.list.find(
        ({ stashAddress }) => accountId === stashAddress
      )
      validator.selected = false
    } else if (selectedAddresses.length < network.validatorSetSize) {
      // check if a member of the same cluster is already in the set
      const validator = state.list.find(
        ({ stashAddress }) => accountId === stashAddress
      )
      const clusterMemberAlreadyIncluded = state.list
        .filter(({ stashAddress }) =>
          state.selectedAddresses.includes(stashAddress)
        )
        .some(
          ({ clusterName, partOfCluster }) =>
            partOfCluster && clusterName === validator.clusterName
        )
      if (clusterMemberAlreadyIncluded) {
        const bootStrapToaster = new BToast()
        if (!state.onlyOneClusterMember) {
          bootStrapToaster.$bvToast.toast(
            'Selecting more than one member of a cluster is not recommended',
            {
              title: 'Cluster already included!',
              variant: 'warning',
              autoHideDelay: 5000,
              appendToast: false,
            }
          )
          selectedAddresses.push(accountId)
          validator.selected = true
        } else {
          bootStrapToaster.$bvToast.toast(
            'Selecting more than one member of a cluster is not allowed',
            {
              title: 'Cluster already included!',
              variant: 'danger',
              autoHideDelay: 5000,
              appendToast: false,
            }
          )
        }
      } else {
        selectedAddresses.push(accountId)
        validator.selected = true
      }
    } else {
      const bootStrapToaster = new BToast()
      bootStrapToaster.$bvToast.toast(
        'Please remove before selecting a new one',
        {
          title: `Select up to ${network.validatorSetSize} validators`,
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: false,
        }
      )
    }
    state.selectedAddresses = selectedAddresses
    this.$cookies.set(
      `${network.name}-selectedValidatorAddresses`,
      selectedAddresses,
      {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      }
    )
  },
  importValidatorSet(state, validators) {
    state.selectedAddresses = validators
    state.list = state.list.map((validator) => {
      validator.selected = validators.includes(validator.stashAddress)
      return validator
    })
  },
  importChainValidatorAddresses(state, validators) {
    state.chainValidatorAddresses = validators
  },
  updateMetricWeights(state, metricWeights) {
    state.metricWeights = metricWeights
    // recalculate custom VRC score & update dominated validators
    state.list = state.list.map((validator) => {
      let dominated = false
      for (const opponent of state.list) {
        if (
          opponent !== validator &&
          opponent.relativePerformance >= validator.relativePerformance &&
          new BigNumber(opponent.selfStake).gte(
            new BigNumber(validator.selfStake)
          ) &&
          opponent.activeEras >= validator.activeEras &&
          opponent.totalRating >= validator.totalRating
        ) {
          dominated = true
          break
        }
      }
      validator.customVRCScore =
        validator.activeRating * state.metricWeights.active +
        validator.commissionRating * state.metricWeights.commission +
        validator.eraPointsRating * state.metricWeights.eraPoints +
        validator.governanceRating * state.metricWeights.governance +
        validator.identityRating * state.metricWeights.identity +
        validator.nominatorsRating * state.metricWeights.nominators +
        validator.addressCreationRating * state.metricWeights.address +
        validator.payoutRating * state.metricWeights.payout +
        validator.slashRating * state.metricWeights.slashes +
        validator.subAccountsRating * state.metricWeights.subaccounts
      validator.dominated = dominated
      return validator
    })
    // eslint-disable-next-line no-console
    console.log(
      `Found ${
        state.list.filter(({ dominated }) => dominated).length
      } dominated validators`
    )
  },
  toggleCustomVRCScore(state, customVRCScoreEnabled) {
    state.customVRCScoreEnabled = customVRCScoreEnabled
    // recalculate custom VRC score & update dominated validators
    if (customVRCScoreEnabled) {
      state.list = state.list.map((validator) => {
        let dominated = false
        for (const opponent of state.list) {
          if (
            opponent !== validator &&
            opponent.relativePerformance >= validator.relativePerformance &&
            new BigNumber(opponent.selfStake).gte(
              new BigNumber(validator.selfStake)
            ) &&
            opponent.activeEras >= validator.activeEras &&
            opponent.totalRating >= validator.totalRating
          ) {
            dominated = true
            break
          }
        }
        validator.customVRCScore =
          validator.activeRating * state.metricWeights.active +
          validator.commissionRating * state.metricWeights.commission +
          validator.eraPointsRating * state.metricWeights.eraPoints +
          validator.governanceRating * state.metricWeights.governance +
          validator.identityRating * state.metricWeights.identity +
          validator.nominatorsRating * state.metricWeights.nominators +
          validator.addressCreationRating * state.metricWeights.address +
          validator.payoutRating * state.metricWeights.payout +
          validator.slashRating * state.metricWeights.slashes +
          validator.subAccountsRating * state.metricWeights.subaccounts
        validator.dominated = dominated
        return validator
      })
    } else {
      state.list = state.list.map((validator) => {
        validator.customVRCScore = validator.totalRating
        return validator
      })
    }
  },
  updateDominated(state) {
    // update dominated validators
    state.list = state.list.map((validator) => {
      let dominated = false
      for (const opponent of state.list) {
        if (
          opponent !== validator &&
          opponent.relativePerformance >= validator.relativePerformance &&
          new BigNumber(opponent.selfStake).gte(
            new BigNumber(validator.selfStake)
          ) &&
          opponent.activeEras >= validator.activeEras &&
          opponent.totalRating >= validator.totalRating
        ) {
          dominated = true
          break
        }
      }
      validator.dominated = dominated
      return validator
    })
    // eslint-disable-next-line no-console
    console.log(
      `Found ${
        state.list.filter(({ dominated }) => dominated).length
      } dominated validators`
    )
  },
  toggleOnlyOneClusterMember(state, onlyOneClusterMember) {
    state.onlyOneClusterMember = onlyOneClusterMember
    // eslint-disable-next-line no-console
    console.log(
      `Allow only one cluster member per set is ${
        state.onlyOneClusterMember ? 'on' : 'off'
      }`
    )
  },
}

export const actions = {
  async updateList(context) {
    const startTime = new Date().getTime()
    const client = this.app.apolloProvider.defaultClient
    const metricWeights = this.getters['ranking/getMetricWeights']
    const selectedAddresses = this.getters['ranking/getSelectedAddresses']
    // get last block height
    let query = gql`
      query blockHeight {
        ranking(order_by: { block_height: asc }, limit: 1) {
          block_height
        }
      }
    `
    const response = await client.query({ query })
    const blockHeight = response.data.ranking[0].block_height
    query = gql`
      query ranking {
        ranking (where: {block_height: {_eq: "${blockHeight}"}}) {
          active
          active_eras
          active_rating
          address_creation_rating
          commission
          commission_rating
          dominated
          era_points_percent
          era_points_rating
          governance_rating
          identity_rating
          name
          nominators_rating
          other_stake
          part_of_cluster
          cluster_name
          show_cluster_member
          payout_rating
          rank
          relative_performance
          self_stake
          slash_rating
          stash_address
          sub_accounts_rating
          total_rating
          total_stake
          verified_identity
        }
      }
    `
    const { data } = await client.query({ query })
    // eslint-disable-next-line
    console.log(data)
    const ranking = data.ranking.map((validator) => {
      return {
        active: validator.active,
        activeEras: validator.active_eras,
        activeRating: validator.active_rating,
        addressCreationRating: validator.address_creation_rating,
        commission: parseFloat(validator.commission),
        commissionRating: validator.commission_rating,
        dominated: validator.dominated,
        eraPointsPercent: parseFloat(validator.era_points_percent),
        eraPointsRating: validator.era_points_rating,
        governanceRating: validator.governance_rating,
        identityRating: validator.identity_rating,
        name: validator.name,
        nominatorsRating: validator.nominators_rating,
        otherStake: validator.other_stake,
        partOfCluster: validator.part_of_cluster,
        clusterName: validator.cluster_name,
        showClusterMember: validator.show_cluster_member,
        payoutRating: validator.payout_rating,
        rank: validator.rank,
        relativePerformance: parseFloat(validator.relative_performance),
        selfStake: validator.self_stake,
        slashRating: validator.slash_rating,
        stashAddress: validator.stash_address,
        subAccountsRating: validator.sub_accounts_rating,
        totalRating: validator.total_rating,
        totalStake: validator.total_stake,
        verifiedIdentity: validator.verified_identity,
        customVRCScore:
          validator.active_rating * metricWeights.active +
          validator.commission_rating * metricWeights.commission +
          validator.era_points_rating * metricWeights.eraPoints +
          validator.governance_rating * metricWeights.governance +
          validator.identity_rating * metricWeights.identity +
          validator.nominators_rating * metricWeights.nominators +
          validator.address_creation_rating * metricWeights.address +
          validator.payout_rating * metricWeights.payout +
          validator.slash_rating * metricWeights.slashes +
          validator.sub_accounts_rating * metricWeights.subaccounts,
        selected: selectedAddresses.includes(validator.stash_address),
      }
    })
    const eraPointsAverage =
      ranking.reduce(
        (accumulator, { eraPointsPercent }) =>
          accumulator + parseFloat(eraPointsPercent),
        0
      ) / ranking.filter(({ active }) => active === true).length
    context.commit('updateList', {
      ranking,
      blockHeight,
      eraPointsAverage,
      loading: false,
    })
    const dataCollectionEndTime = new Date().getTime()
    const dataCollectionTime = dataCollectionEndTime - startTime
    // eslint-disable-next-line
    console.log(ranking)
    // eslint-disable-next-line
    console.log(
      `data collection time: ${(dataCollectionTime / 1000).toFixed(3)}s`
    )
  },
  loadSelected(context) {
    context.commit('loadSelected')
  },
  toggleSelected(context, accountId) {
    context.commit('toggleSelected', accountId)
  },
  updateSelectedAddress(context, accountId) {
    context.commit('updateSelectedAddress', accountId)
  },
  importValidatorSet(context, validators) {
    context.commit('importValidatorSet', validators)
  },
  importChainValidatorAddresses(context, validators) {
    context.commit('importChainValidatorAddresses', validators)
  },
  updateMetricWeights(context, metricWeights) {
    context.commit('updateMetricWeights', metricWeights)
  },
  toggleCustomVRCScore(context, customVRCScoreEnabled) {
    context.commit('toggleCustomVRCScore', customVRCScoreEnabled)
  },
  updateDominated(context) {
    context.commit('updateDominated')
  },
  toggleOnlyOneClusterMember(context, onlyOneClusterMember) {
    context.commit('toggleOnlyOneClusterMember', onlyOneClusterMember)
  },
}

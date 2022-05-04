<template>
  <dropdown-menu v-if="variant" :variant="variant" :value="value">
    
	<b-dropdown-header class="mb-3">
		<div v-if="loading" class="text-center">
			{{ $t('components.selected_validators.loading') }}
		</div>
		<div v-else-if="list.length === 0" class="text-center">
			{{ $t('components.selected_validators.no_validators_selected') }}
		</div>
		<div v-else class="row align-items-center text-i-fifth">
			<div class="col-8">{{ list.length }}/{{ config.validatorSetSize }}</div>
			<div class="col-4 text-right">
				<a
				href="#"
				class="text-i-fifth"
				v-b-tooltip.hover
				v-clipboard:copy="selectedAddressesText"
				title="Copy validator addresses to clipboard"
				@click.stop.prevent="showToast"
				>
					<font-awesome-icon icon="paperclip" />
				</a>
			</div>
		</div>
    </b-dropdown-header>

    <b-dropdown-item
      v-for="validator in list"
      :key="`selected-validator-${validator.stashAddress}`"
	  class="text-nowrap"
    >
		<div class="row align-items-center">
			<div class="col-9">
				<Identicon class="mr-2" :address="validator.stashAddress" :size="15" />
				<nuxt-link :to="localePath(`/validator/${validator.stashAddress}`)">
				<span v-if="validator.name">
					{{ validator.name }}
					<VerifiedIcon class="ml-2" />
				</span>
				<span v-else>
					{{ shortAddress(validator.stashAddress) }}
				</span>
				</nuxt-link>
			</div>
			<div class="col-3 text-right text-i-fifth">
				<a
				v-b-tooltip.hover
				href="#"
				title="Remove"
				@click.stop.prevent="remove(validator.stashAddress)"
				>
				<font-awesome-icon icon="times" />
				</a>
			</div>
		</div>
    </b-dropdown-item>

    <b-dropdown-text v-if="list.length > 0" class="mt-3">
		<b-button variant="danger btn-sm btn-block" @click="clean()">
		{{ $t('components.selected_validators.clear') }}
		<font-awesome-icon icon="trash-alt" class="ml-1" />
		</b-button>
		<b-button variant="i-fourth btn-sm btn-block m-0" to="/nominate">
			{{ $t('components.selected_validators.nominate') }}
		</b-button>
    </b-dropdown-text>

  </dropdown-menu>


  <div v-else class="selected-validators">
    <p v-if="loading" class="mb-0 text-center">
      {{ $t('components.selected_validators.loading') }}
    </p>
    <p v-else-if="list.length === 0" class="mb-0 text-center">
      {{ $t('components.selected_validators.no_validators_selected') }}
    </p>
    <div v-else class="row mb-3">
      <div class="col-8">{{ list.length }}/{{ config.validatorSetSize }}</div>
      <div class="col-4 text-right">
        <span
          v-b-tooltip.hover
          v-clipboard:copy="selectedAddressesText"
          title="Copy validator addresses to clipboard"
          @click.stop.prevent="showToast"
        >
          <font-awesome-icon
            icon="paperclip"
            style="color: gray; font-size: 1.5rem; cursor: pointer"
          />
        </span>
      </div>
    </div>
    <div
      v-for="validator in list"
      :key="`selected-validator-${validator.stashAddress}`"
      class="row"
    >
      <div class="col-10 selected-validator">
        <Identicon :address="validator.stashAddress" :size="20" />
        <nuxt-link :to="localePath(`/validator/${validator.stashAddress}`)">
          <span v-if="validator.name">
            {{ validator.name }}
            <VerifiedIcon />
          </span>
          <span v-else>
            {{ shortAddress(validator.stashAddress) }}
          </span>
        </nuxt-link>
      </div>
      <div class="col-2 text-right">
        <a
          v-b-tooltip.hover
          href="#"
          title="Remove"
          class="remove"
          @click.stop.prevent="remove(validator.stashAddress)"
        >
          <font-awesome-icon icon="times" />
        </a>
      </div>
    </div>
    <div v-if="list.length > 0" class="row mt-3 mb-0">
      <div class="col-4">
        <b-button variant="danger" class="clear btn-block" @click="clean()">
          <font-awesome-icon icon="trash-alt" />
          {{ $t('components.selected_validators.clear') }}
        </b-button>
      </div>
      <div class="col-8">
        <b-button
          variant="primary2"
          class="nominate btn-block"
          to="/nominate"
          >{{ $t('components.selected_validators.nominate') }}</b-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import { config } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'
import DropdownMenu from '@/components/more/DropdownMenu.vue';

export default {
  mixins: [commonMixin],
  components: { DropdownMenu },
  props: ['variant', 'value'],
  data() {
    return {
      config,
    }
  },
  computed: {
    loading() {
      return this.$store.state.ranking.loading
    },
    list() {
      return this.$store.state.ranking.list.filter(({ stashAddress }) =>
        this.selectedAddresses.includes(stashAddress)
      )
    },
    selectedAddresses() {
      return this.$store.state.ranking.selectedAddresses
    },
    selectedAddressesText() {
      return this.selectedAddresses.join('\r\n')
    },
  },
  methods: {
    showToast() {
      this.$bvToast.toast(this.selectedAddressesText, {
        title: 'Addresses copied to clipboard!',
        variant: 'secondary',
        autoHideDelay: 5000,
        appendToast: false,
      })
    },
    remove(accountId) {
      this.$store.dispatch('ranking/toggleSelected', { accountId })
    },
    clean() {
      this.$store.dispatch('ranking/importValidatorSet', [])
    },
  },
}
</script>

<template>
  <div class="widget mb-4">
    <div class="row">
      <div class="col-10">
        <h5 class="widget-title mb-2">
          <nuxt-link
            v-b-tooltip.hover
            to="/help#custom-vrc-score"
            :title="$t('components.metric_weights.help')"
          >
            <font-awesome-icon
              icon="question-circle"
              class="d-inline-block"
              style="font-size: 1rem"
            />
          </nuxt-link>
          {{ $t('components.metric_weights.customize_validator_score') }}
        </h5>
      </div>
      <div class="col-2 text-right">
        <span v-b-toggle.custom-vrc-score-collapse class="m-1">
          <font-awesome-icon icon="chevron-up" class="when-open" />
          <font-awesome-icon icon="chevron-down" class="when-closed" />
        </span>
      </div>
    </div>
    <b-collapse id="custom-vrc-score-collapse" visible>
      <div class="row mt-2">
        <div class="col-12">
          <div class="row">
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.elected') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#elected"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray">x{{ metricWeights.active }}</span>
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.active"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.commission_changes') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#commission"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray"
                    >x{{ metricWeights.commission }}</span
                  >
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.commission"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.era_points_avg') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#erapoints"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray"
                    >x{{ metricWeights.eraPoints }}</span
                  >
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.eraPoints"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.governance_participation') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#governance"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray"
                    >x{{ metricWeights.governance }}</span
                  >
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.governance"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.identity') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#identity"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray">x{{ metricWeights.identity }}</span>
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.identity"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.number_of_nominators') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#nominators"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray"
                    >x{{ metricWeights.nominators }}</span
                  >
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.nominators"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.address_creation') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#address"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray">x{{ metricWeights.address }}</span>
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.address"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.payout_frequency') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#payouts"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray">x{{ metricWeights.payout }}</span>
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.payout"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.slashes') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#slashes"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray">x{{ metricWeights.slashes }}</span>
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.slashes"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="row">
                <div class="col-8 col-md-6">
                  {{ $t('components.metric_weights.subaccounts') }}
                  <nuxt-link
                    v-b-tooltip.hover
                    to="/help/metrics#subaccounts"
                    title="Check metric definition"
                  >
                    <font-awesome-icon
                      icon="question-circle"
                      class="d-inline-block"
                      style="font-size: 0.9rem"
                    />
                  </nuxt-link>
                  -
                  <span style="color: gray"
                    >x{{ metricWeights.subaccounts }}</span
                  >
                </div>
                <div class="col-4 col-md-6">
                  <b-form-input
                    v-model="metricWeights.subaccounts"
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    style="width: 5rem"
                    @change="updateVCRScore()"
                  ></b-form-input>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="text-center my-4">
        <b-form-checkbox
          switch
          size="lg"
          class="xl-switch"
          :checked="customVRCScoreEnabled"
          @change="toggle()"
        />
      </div>
      <p v-if="loading" class="text-center mb-2">
        {{ $t('components.metric_weights.updating_score') }}...
      </p>
    </b-collapse>
  </div>
</template>

<script>
export default {
  data() {
    return {
      customVRCScoreEnabled: false,
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
      loading: false,
    }
  },
  methods: {
    updateVCRScore() {
      this.loading = true
      this.$store.dispatch(
        'ranking/updateMetricWeights',
        JSON.parse(JSON.stringify(this.metricWeights))
      )
      this.loading = false
    },
    toggle() {
      this.loading = true
      this.customVRCScoreEnabled = !this.customVRCScoreEnabled
      this.$store.dispatch(
        'ranking/toggleCustomVRCScore',
        JSON.parse(JSON.stringify(this.customVRCScoreEnabled))
      )
      this.loading = false
    },
  },
}
</script>

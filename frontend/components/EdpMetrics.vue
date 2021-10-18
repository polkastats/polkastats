<template>
  <div v-if="network.enableEdpMetric">
    <div class="title mb-4">EDP Metrics</div>
    <div class="row">
      <div
        v-for="(value, name) in metrics"
        :key="value"
        class="col-6 col-md-6 col-lg-3 mb-4 chain-info"
      >
        <div class="card h-100">
          <div class="card-body">
            <h4 class="mb-3">{{ name }}</h4>

            <h6 class="d-inline-block">
              {{ value }}
            </h6>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '../mixins/commonMixin.js'
import { network } from '../frontend.config.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      network,
      metrics: {},
      loading: true,
    }
  },
  apollo: {
    $subscribe: {
      metrics: {
        query: gql`
          subscription edp {
            edp {
              value
            }
          }
        `,
        result({ data }) {
          this.metrics = data.edp[0].value
          this.loading = false
        },
      },
    },
  },
}
</script>

<style>
.title {
  font-size: 20px;
  color: #001c71;
  text-transform: uppercase;
  padding: 5px;
}
.chain-info .card {
  box-shadow: 0 8px 20px 0 rgb(40 133 208 / 15%);
}
</style>

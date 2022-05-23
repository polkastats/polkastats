<template>
  <div>
    <section>
      <b-container class="main py-5">
        <div class="ddc mb-4">
          <div class="row">
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">{{ $t('pages.ddc.data_stored') }}</h4>
                  <h6 class="d-inline-block">
                    {{ prettyBytes(dataStoredBytes) }}
                  </h6>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.pieces_stored') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ formatNumber(piecesStored) }}
                  </h6>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.pieces_viewed') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ formatNumber(piecesViewed) }}
                  </h6>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.unique_accounts') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ formatNumber(uniqueAccounts) }}
                  </h6>
                </div>
              </div>
            </div>
          </div>
          <!-- new row -->
          <div class="row">
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">{{ $t('pages.ddc.providers') }}</h4>
                  <h6 class="d-inline-block">
                    {{ formatNumber(providers) }}
                  </h6>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.storage_capacity') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ prettyGigabytes(storageCapacity) }}
                  </h6>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.storage_nodes') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ formatNumber(storageNodes) }}
                  </h6>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.gateway_nodes') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ formatNumber(gatewayNodes) }}
                  </h6>
                </div>
              </div>
            </div>
          </div>
          <!-- new row -->
          <div class="row">
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.avg_response_time') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ secToMs(avgResponseTimeSec) }} ms
                  </h6>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.avg_download_speed') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ bytesToPrettyBits(avgDownloadSpeedBytesPerSec) }}/s
                  </h6>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.avg_upload_speed') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ bytesToPrettyBits(avgUploadSpeedBytesPerSec) }}/s
                  </h6>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-6 col-lg-3 mb-4">
              <div class="card h-100">
                <div class="card-body">
                  <h4 class="mb-3 title">
                    {{ $t('pages.ddc.avg_price_per_storage') }}
                  </h4>
                  <h6 class="d-inline-block">
                    {{ formatAmount(avgPricePerStorage) }} GB/Month
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import prettyBytes from 'pretty-bytes'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config'

export default {
  mixins: [commonMixin],
  data() {
    return {
      dataStoredBytes: 0,
      piecesStored: 0,
      piecesViewed: 0,
      uniqueAccounts: 0,
      providers: 0,
      storageCapacity: 0,
      storageNodes: 0,
      gatewayNodes: 0,
      avgResponseTimeSec: 0,
      avgDownloadSpeedBytesPerSec: 0,
      avgUploadSpeedBytesPerSec: 0,
      avgPricePerStorage: 0,
    }
  },
  head() {
    return {
      title: this.$t('pages.ddc.head_title', {
        networkName: network.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.ddc.head_content', {
            networkName: network.name,
          }),
        },
      ],
    }
  },
  methods: {
    bytesToPrettyBits(bytes) {
      return prettyBytes(bytes * 8, { bits: true, maximumFractionDigits: 2 })
    },
    secToMs(sec) {
      return sec * 1000
    },
    prettyBytes(bytes) {
      return prettyBytes(bytes, { maximumFractionDigits: 2 })
    },
    prettyGigabytes(gigabytes) {
      return prettyBytes(gigabytes * 1000 * 1000 * 1000, {
        maximumFractionDigits: 2,
      })
    },
  },
  apollo: {
    $subscribe: {
      dataStoredBytes: {
        query: gql`
          subscription dataStoredBytes {
            ddc_metric_view_aggregate(
              distinct_on: [nodeid]
              order_by: { nodeid: asc, timestamp: desc }
              where: { name: { _eq: "dataStoredBytes" } }
            ) {
              aggregate {
                sum {
                  value
                }
              }
            }
          }
        `,
        // sum latest value of the node
        result({ data }) {
          this.dataStoredBytes =
            data.ddc_metric_view_aggregate.aggregate.sum.value
        },
      },
      piecesStored: {
        query: gql`
          subscription piecesStored {
            ddc_metric_view_aggregate(
              distinct_on: [nodeid]
              order_by: { nodeid: asc, timestamp: desc }
              where: { name: { _eq: "piecesStored" } }
            ) {
              aggregate {
                sum {
                  value
                }
              }
            }
          }
        `,
        result({ data }) {
          this.piecesStored = data.ddc_metric_view_aggregate.aggregate.sum.value
        },
      },
      piecesViewed: {
        query: gql`
          subscription piecesViewed {
            ddc_metric_view_aggregate(
              distinct_on: [nodeid]
              order_by: { nodeid: asc, timestamp: desc }
              where: { name: { _eq: "piecesViewed" } }
            ) {
              aggregate {
                sum {
                  value
                }
              }
            }
          }
        `,
        result({ data }) {
          this.piecesViewed = data.ddc_metric_view_aggregate.aggregate.sum.value
        },
      },
      uniqueAccounts: {
        query: gql`
          subscription providers {
            ddc_metric_view(
              order_by: { timestamp: desc }
              limit: 1
              where: { name: { _eq: "uniqueAccounts" } }
            ) {
              value
            }
          }
        `,
        result({ data }) {
          this.uniqueAccounts = data.ddc_metric_view[0].value
        },
      },
      providers: {
        query: gql`
          subscription providers {
            ddc_metric_view(
              order_by: { timestamp: desc }
              limit: 1
              where: { name: { _eq: "providers" } }
            ) {
              value
            }
          }
        `,
        result({ data }) {
          this.providers = data.ddc_metric_view[0].value
        },
      },
      storageCapacity: {
        query: gql`
          subscription providers {
            ddc_metric_view(
              order_by: { timestamp: desc }
              limit: 1
              where: { name: { _eq: "storageCapacity" } }
            ) {
              value
            }
          }
        `,
        result({ data }) {
          this.storageCapacity = data.ddc_metric_view[0].value
        },
      },
      storageNodes: {
        query: gql`
          subscription providers {
            ddc_metric_view(
              order_by: { timestamp: desc }
              limit: 1
              where: { name: { _eq: "storageNodes" } }
            ) {
              value
            }
          }
        `,
        result({ data }) {
          this.storageNodes = data.ddc_metric_view[0].value
        },
      },
      gatewayNodes: {
        query: gql`
          subscription providers {
            ddc_metric_view(
              order_by: { timestamp: desc }
              limit: 1
              where: { name: { _eq: "gatewayNodes" } }
            ) {
              value
            }
          }
        `,
        result({ data }) {
          this.gatewayNodes = data.ddc_metric_view[0].value
        },
      },
      avgResponseTimeSec: {
        query: gql`
          subscription avgResponseTimeSec($timestamp: bigint!) {
            ddc_metric_view_aggregate(
              distinct_on: [nodeid]
              order_by: { nodeid: asc, timestamp: desc }
              where: {
                name: { _eq: "avgResponseTimeSec" }
                timestamp: { _gte: $timestamp }
              }
            ) {
              aggregate {
                avg {
                  value
                }
              }
            }
          }
        `,
        variables() {
          const timestamp = new Date()
          timestamp.setMonth(timestamp.getMonth() - 1)
          return {
            timestamp: timestamp.getMilliseconds(),
          }
        },
        result({ data }) {
          this.avgResponseTimeSec =
            data.ddc_metric_view_aggregate.aggregate.avg.value
        },
      },
      avgDownloadSpeedBytesPerSec: {
        query: gql`
          subscription avgDownloadSpeedBytesPerSec($timestamp: bigint!) {
            ddc_metric_view_aggregate(
              distinct_on: [nodeid]
              order_by: { nodeid: asc, timestamp: desc }
              where: {
                name: { _eq: "avgDownloadSpeedBytesPerSec" }
                timestamp: { _gte: $timestamp }
              }
            ) {
              aggregate {
                avg {
                  value
                }
              }
            }
          }
        `,
        variables() {
          const timestamp = new Date()
          timestamp.setMonth(timestamp.getMonth() - 1)
          return {
            timestamp: timestamp.getMilliseconds(),
          }
        },
        result({ data }) {
          this.avgDownloadSpeedBytesPerSec =
            data.ddc_metric_view_aggregate.aggregate.avg.value
        },
      },
      avgUploadSpeedBytesPerSec: {
        query: gql`
          subscription avgUploadSpeedBytesPerSec($timestamp: bigint!) {
            ddc_metric_view_aggregate(
              distinct_on: [nodeid]
              order_by: { nodeid: asc, timestamp: desc }
              where: {
                name: { _eq: "avgUploadSpeedBytesPerSec" }
                timestamp: { _gte: $timestamp }
              }
            ) {
              aggregate {
                avg {
                  value
                }
              }
            }
          }
        `,
        variables() {
          const timestamp = new Date()
          timestamp.setMonth(timestamp.getMonth() - 1)
          return {
            timestamp: timestamp.getMilliseconds(),
          }
        },
        result({ data }) {
          this.avgUploadSpeedBytesPerSec =
            data.ddc_metric_view_aggregate.aggregate.avg.value
        },
      },
      avgPricePerStorage: {
        query: gql`
          subscription providers {
            ddc_metric_view(
              order_by: { timestamp: desc }
              limit: 1
              where: { name: { _eq: "avgPricePerStorage" } }
            ) {
              value
            }
          }
        `,
        result({ data }) {
          this.avgPricePerStorage = data.ddc_metric_view[0].value
        },
      },
    },
  },
}
</script>

<style>
.ddc .card {
  box-shadow: 0 8px 20px 0 rgb(40 133 208 / 15%);
}
</style>

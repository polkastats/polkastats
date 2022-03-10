<template>
  <div>
    <section>
      <b-container class="main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>
              {{ $t('pages.extrinsics.title') }}
              <small v-if="totalRows !== 1" class="ml-1" style="font-size: 1rem"
                >[{{ formatNumber(totalRows) }}]</small
              >
            </h1>
          </b-col>
        </b-row>
        <div class="last-extrinsics">
          <!-- Filter -->
          <b-row style="margin-bottom: 1rem">
            <b-col cols="12">
              <b-form-input
                id="filterInput"
                v-model="filter"
                type="search"
                :placeholder="$t('pages.blocks.search_placeholder')"
              />
            </b-col>
          </b-row>
          <b-row style="margin-bottom: 1rem">
            <b-col cols="4">
              <b-form-select
                v-model="selectedRuntimeVersion"
                :options="runtimeSpecVersionOptions"
                @change="
                  selectedPalletName = null
                  loading = true
                "
              ></b-form-select>
            </b-col>
            <b-col cols="4">
              <b-form-select
                v-model="selectedPalletName"
                :options="palletNameOptions"
                @change="
                  selectedPalletExtrinsic = null
                  loading = true
                "
              ></b-form-select>
            </b-col>
            <b-col cols="4">
              <b-form-select
                v-model="selectedPalletExtrinsic"
                :options="palletExtrinsicsOptions"
                @change="loading = true"
              ></b-form-select>
            </b-col>
          </b-row>
          <p>
            runtime: {{ selectedRuntimeVersion }} / module:
            {{ selectedPalletName }} / extrinsic: {{ selectedPalletExtrinsic }}
          </p>
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <template v-else>
            <div class="table-responsive">
              <b-table striped hover :fields="fields" :items="extrinsics">
                <template #cell(block_number)="data">
                  <p class="mb-0">
                    <nuxt-link
                      v-b-tooltip.hover
                      :to="`/extrinsic/${data.item.block_number}/${data.item.extrinsic_index}`"
                      title="Check extrinsic information"
                    >
                      {{ data.item.block_number }}-{{
                        data.item.extrinsic_index
                      }}
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(hash)="data">
                  <p class="mb-0">{{ shortHash(data.item.hash) }}</p>
                </template>
                <template #cell(section)="data">
                  <p class="mb-0">
                    {{ data.item.section }} ➡
                    {{ data.item.method }}
                  </p>
                </template>
                <template #cell(success)="data">
                  <p class="mb-0">
                    <font-awesome-icon
                      v-if="data.item.success"
                      icon="check"
                      class="text-success"
                    />
                    <font-awesome-icon
                      v-else
                      icon="times"
                      class="text-danger"
                    />
                  </p>
                </template>
              </b-table>
            </div>
            <!-- pagination -->
            <div class="row">
              <div class="col-6">
                <!-- desktop -->
                <div class="d-none d-sm-none d-md-none d-lg-block d-xl-block">
                  <b-button-group>
                    <b-button
                      v-for="(option, index) in paginationOptions"
                      :key="index"
                      variant="outline-primary2"
                      :class="{ 'selected-per-page': perPage === option }"
                      @click="setPageSize(option)"
                    >
                      {{ option }}
                    </b-button>
                  </b-button-group>
                </div>
                <!-- mobile -->
                <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
                  <b-dropdown
                    class="m-md-2"
                    text="Page size"
                    variant="outline-primary2"
                  >
                    <b-dropdown-item
                      v-for="(option, index) in paginationOptions"
                      :key="index"
                      @click="setPageSize(10)"
                    >
                      {{ option }}
                    </b-dropdown-item>
                  </b-dropdown>
                </div>
              </div>
              <div class="col-6">
                <b-pagination
                  v-model="currentPage"
                  :total-rows="totalRows"
                  :per-page="perPage"
                  aria-controls="my-table"
                  variant="dark"
                  align="right"
                ></b-pagination>
              </div>
            </div>
          </template>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { network, paginationOptions } from '@/frontend.config.js'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: '',
      extrinsics: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'block_number',
          label: 'Extrinsic',
          sortable: true,
        },
        {
          key: 'hash',
          label: 'Hash',
          sortable: true,
        },
        {
          key: 'section',
          label: 'Extrinsic',
          sortable: true,
        },
        {
          key: 'success',
          label: 'Success',
          sortable: true,
        },
      ],
      runtimeVersions: [],
      palletsAndExtrinsics: [],
      selectedRuntimeVersion: null,
      selectedPalletName: null,
      selectedPalletExtrinsic: null,
    }
  },
  head() {
    return {
      title: this.$t('pages.extrinsics.head_title', {
        networkName: network.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.extrinsics.head_content', {
            networkName: network.name,
          }),
        },
      ],
    }
  },
  computed: {
    runtimeSpecVersionOptions() {
      const runtimeSpecVersionOptions = this.runtimeVersions.map(
        (specVersion) => ({
          value: specVersion.spec_version,
          text: specVersion.spec_version,
        })
      )
      return runtimeSpecVersionOptions
    },
    palletNameOptions() {
      const palletNames = this.palletsAndExtrinsics
        .filter(({ calls }) => calls.length !== 0)
        .map(({ name }) => name)
        .sort()
        .map((palletName) => ({
          value: this.uncapitalize(palletName),
          text: palletName,
        }))
      // console.log('modules:', palletNameOptions)
      return [{ value: null, text: 'All' }].concat(palletNames)
    },
    palletExtrinsicsOptions() {
      const vm = this
      let palletExtrinsics = []
      if (this.selectedPalletName) {
        const selectedPallet = this.palletsAndExtrinsics.find(
          ({ name }) => name === vm.capitalize(vm.selectedPalletName)
        )
        palletExtrinsics = selectedPallet.calls
          .sort()
          .map((moduleExtrinsic) => ({
            value: this.snakeToCamel(moduleExtrinsic),
            text: this.snakeToCamel(moduleExtrinsic),
          }))
      }
      // console.log('extrinsics:', palletExtrinsics)
      return [{ value: null, text: 'All' }].concat(palletExtrinsics)
    },
  },
  methods: {
    setPageSize(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
  apollo: {
    $subscribe: {
      extrinsic: {
        query: gql`
          subscription extrinsics(
            $blockNumber: bigint
            $section: String
            $method: String
            $perPage: Int!
            $offset: Int!
          ) {
            extrinsic(
              limit: $perPage
              offset: $offset
              where: {
                block_number: { _eq: $blockNumber }
                section: { _eq: $section }
                method: { _eq: $method }
              }
              order_by: { block_number: desc, extrinsic_index: desc }
            ) {
              block_number
              extrinsic_index
              is_signed
              signer
              section
              method
              hash
              success
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.filter ? parseInt(this.filter) : undefined,
            section: this.selectedPalletName
              ? this.selectedPalletName
              : undefined,
            method: this.selectedPalletExtrinsic
              ? this.selectedPalletExtrinsic
              : undefined,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.extrinsics = data.extrinsic
          if (this.filter) {
            this.totalRows = this.extrinsics.length
          }
          this.loading = false
        },
      },
      totalExtrinsics: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "extrinsics" } }, limit: 1) {
              count
            }
          }
        `,
        result({ data }) {
          if (!this.filter) {
            this.totalRows = data.total[0].count
          }
        },
      },
      runtimeVersions: {
        query: gql`
          subscription runtime {
            runtime(order_by: { block_number: desc }) {
              spec_version
            }
          }
        `,
        result({ data }) {
          this.runtimeVersions = data.runtime
          this.selectedRuntimeVersion = data.runtime[0].spec_version
          // console.log('runtime specs:', this.runtimeVersions)
        },
      },
      metadata: {
        query: gql`
          subscription runtime($specVersion: Int!) {
            runtime(where: { spec_version: { _eq: $specVersion } }, limit: 1) {
              metadata_version
              metadata
            }
          }
        `,
        skip() {
          return this.runtimeVersions.length === 0
        },
        variables() {
          return {
            specVersion: this.selectedRuntimeVersion,
          }
        },
        result({ data }) {
          // get pallets and extrinsics from runtime metadata
          const metadataVersion = data.runtime[0].metadata_version
          this.metadata = data.runtime[0].metadata[metadataVersion]
          const palletsAndExtrinsics = []
          if (metadataVersion !== 'v14') {
            this.metadata.modules.forEach((module) => {
              const palletAndExtrinsics = {
                name: module.name,
                calls:
                  module.calls !== null
                    ? module.calls.map((call) => call.name)
                    : [],
              }
              palletsAndExtrinsics.push(palletAndExtrinsics)
            })
          } else {
            this.metadata.pallets.forEach((pallet) => {
              const callsId = pallet.calls?.type || null
              const calls = []
              const palletAndExtrinsics = {
                name: pallet.name,
                callsId,
                calls,
              }
              if (callsId) {
                this.metadata.lookup.types
                  .filter(
                    ({ id, type }) =>
                      type.path.includes('Call') && id === callsId
                  )
                  .forEach(({ type }) => {
                    type.def.variant.variants.forEach((variant) => {
                      palletAndExtrinsics.calls.push(variant.name.toString())
                    })
                  })
              }
              palletsAndExtrinsics.push(palletAndExtrinsics)
            })
          }
          // console.log(
          //   'palletsAndExtrinsics:',
          //   JSON.stringify(palletsAndExtrinsics, null, 2)
          // )
          this.palletsAndExtrinsics = palletsAndExtrinsics
        },
      },
    },
  },
}
</script>

<style>
.last-blocks .identicon {
  display: inline-block;
  margin: 0 0.2rem 0 0;
  cursor: copy;
}
</style>

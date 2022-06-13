<template>
	<div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="extrinsics.length === 0" class="text-center py-4">
      <h5>{{ $t('components.extrinsics.no_extrinsic_found') }}</h5>
    </div>
	<table-component v-else :items="extrinsics" :fields="fields" :options="options" :pagination="pagination" @paginate="currentPage = $event" class="text-center">
		<template #cell(block_number)="data">
              <nuxt-link
                v-b-tooltip.hover
                :to="localePath(`/block?blockNumber=${data.item.block_number}`)"
                :title="$t('common.block_details')"
              >
                #{{ formatNumber(data.item.block_number) }}
              </nuxt-link>
          </template>
          <template #cell(hash)="data">
              <nuxt-link
                v-b-tooltip.hover
                :to="localePath(`/extrinsic/${data.item.hash}`)"
                :title="$t('common.extrinsic_details')"
              >
                {{ shortHash(data.item.hash) }}
              </nuxt-link>
          </template>
          <template #cell(timestamp)="data">
			  <font-awesome-icon icon="calendar-alt" class="mr-1" />
              {{ getDateFromTimestamp(data.item.timestamp) }}
          </template>
          <template #cell(signer)="data">
              <nuxt-link
                :to="localePath(`/account/${data.item.signer}`)"
                :title="$t('pages.accounts.account_details')"
              >
                <Identicon :address="data.item.signer" />
                {{ shortAddress(data.item.signer) }}
              </nuxt-link>
          </template>
          <template #cell(section)="data">
            <div class="timeline" variant="i-primary">
				<span class="timeline-item">{{ data.item.section }}</span>
				<span class="timeline-item">{{ data.item.method }}</span>
            </div>
          </template>
          <template #cell(success)="data">
              <font-awesome-icon v-if="data.item.success" icon="check" class="text-i-success" />
              <font-awesome-icon v-else icon="times" class="text-i-danger" />
          </template>
	</table-component>

  <!-- <div class="sent-transfers">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="extrinsics.length === 0" class="text-center py-4">
      <h5>{{ $t('components.extrinsics.no_extrinsic_found') }}</h5>
    </div>
    <div v-else>
      <div class="table-responsive">
        <b-table striped hover :fields="fields" :items="extrinsics">
          <template #cell(block_number)="data">
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="localePath(`/block?blockNumber=${data.item.block_number}`)"
                :title="$t('common.block_details')"
              >
                #{{ formatNumber(data.item.block_number) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(hash)="data">
            <p class="mb-0">
              <nuxt-link
                v-b-tooltip.hover
                :to="localePath(`/extrinsic/${data.item.hash}`)"
                :title="$t('common.extrinsic_details')"
              >
                {{ shortHash(data.item.hash) }}
              </nuxt-link>
            </p>
          </template>
          <template #cell(timestamp)="data">
            <p class="mb-0">
              {{ getDateFromTimestamp(data.item.timestamp) }}
            </p>
          </template>
          <template #cell(signer)="data">
            <p class="mb-0">
              <nuxt-link
                :to="localePath(`/account/${data.item.signer}`)"
                :title="$t('pages.accounts.account_details')"
              >
                <Identicon :address="data.item.signer" :size="20" />
                {{ shortAddress(data.item.signer) }}
              </nuxt-link>
            </p>
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
              <font-awesome-icon v-else icon="times" class="text-danger" />
            </p>
          </template>
        </b-table>
      </div>
      pagination
      <div class="row">
        <div class="col-6">
          desktop
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
          mobile
          <div class="d-block d-sm-block d-md-block d-lg-none d-xl-none">
            <b-dropdown
              class="m-md-2"
              text="Page size"
              variant="outline-primary2"
            >
              <b-dropdown-item
                v-for="(option, index) in paginationOptions"
                :key="index"
                @click="setPageSize(option)"
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
    </div>
  </div> -->
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Identicon from '@/components/Identicon.vue'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import TableComponent from '@/components/more/TableComponent.vue'

export default {
  components: {
    Identicon,
    Loading,
	TableComponent
  },
  mixins: [commonMixin],
  props: {
    accountId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      extrinsics: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'hash',
          label: 'Hash',
          sortable: false,
		  variant: 'i-fourth',
		  class: 'pkd-separate'
        },
        {
          key: 'block_number',
          label: 'Block',
        //   class: 'd-none d-sm-none d-md-none d-lg-table-cell d-xl-table-cell',
          sortable: false,
		  class: 'pkd-marked'
        },
        {
          key: 'timestamp',
          label: 'Date',
          sortable: false,
        },
        {
          key: 'signer',
          label: 'Signer',
          sortable: false,
        },
        {
          key: 'section',
          label: 'Extrinsic',
          sortable: false,
		  class: 'text-left'
        },
        {
          key: 'success',
          label: 'Success',
          sortable: false,
        },
      ],
    }
  },
  computed:
  {
	options()
	{
		return {
			title: 'Extrinsics',
			variant: 'i-secondary',
		}
	},
	pagination()
	{
		return {
			variant: 'i-primary',
			pages:
			{
				current: this.currentPage,
				rows: this.totalRows,
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
          subscription extrinsic(
            $signer: String!
            $perPage: Int!
            $offset: Int!
          ) {
            signed_extrinsic(
              order_by: { block_number: desc }
              where: { signer: { _eq: $signer } }
              limit: $perPage
              offset: $offset
            ) {
              block_number
              signer
              hash
              section
              method
              success
              timestamp
            }
          }
        `,
        variables() {
          return {
            signer: this.accountId,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        skip() {
          return !this.accountId
        },
        result({ data }) {
          this.extrinsics = data.signed_extrinsic
          this.loading = false
        },
      },
      count: {
        query: gql`
          subscription extrinsic($signer: String!) {
            signed_extrinsic_aggregate(where: { signer: { _eq: $signer } }) {
              aggregate {
                count
              }
            }
          }
        `,
        variables() {
          return {
            signer: this.accountId,
          }
        },
        result({ data }) {
          this.totalRows = data.signed_extrinsic_aggregate.aggregate.count
          this.$emit('totalExtrinsics', this.totalRows)
        },
      },
    },
  },
}
</script>

<style>
.sent-transfers {
  background-color: white;
}
.spinner {
  color: #d3d2d2;
}
</style>

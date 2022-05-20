<template>

	<main>

		<header-component>
			<search-section 
				:title="$t('pages.blocks.title')" 
				:placeholder="$t('pages.blocks.search_placeholder')"
				:results="formatNumber(totalRows)"
				v-model="filter"
			/>
		</header-component>

		<section class="section">

			<Loading v-if="loading" />
			<table-component v-else :items="blocks" :fields="fields" :options="options" :pagination="pagination" @paginate="currentPage = $event" class="text-center">
				<template #cell(block_number)="data">
                    <nuxt-link
                      v-b-tooltip.hover
                      :to="
                        localePath(
                          `/block?blockNumber=${data.item.block_number}`
                        )
                      "
                      :title="$t('common.block_details')"
                    >
                      #{{ formatNumber(data.item.block_number) }}
                    </nuxt-link>
                </template>
                <template #cell(timestamp)="data">
					<font-awesome-icon icon="clock" />
                    {{ fromNow(data.item.timestamp) }}
                </template>
                <template #cell(block_author)="data">
                  <div icon="avatar">
                    <Identicon :address="data.item.block_author" :size="22" />
                    <nuxt-link
                      :to="localePath(`/validator/${data.item.block_author}`)"
                    >
                      <template v-if="data.item.block_author_name">{{
                        data.item.block_author_name
                      }}</template>
                      <template v-else>{{
                        shortAddress(data.item.block_author)
                      }}</template>
                    </nuxt-link>
                  </div>
                </template>
                <template #cell(finalized)="data">
                  <template v-if="data.item.finalized">
                    <font-awesome-icon icon="check" class="text-i-success" />
                    {{ $t('common.finalized') }}
                  </template>
                  <template v-else>
                    <font-awesome-icon icon="spinner" class="text-i-danger" spin />
                    {{ $t('common.processing') }}
                  </template>
                </template>
                <template #cell(block_hash)="data">
                    {{ shortHash(data.item.block_hash) }}
                </template>
			</table-component>

		</section>
	</main>

  <!-- <div>
    <section>
      <b-container class="main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>
              {{ $t('pages.blocks.title') }}
              <small class="ml-1" style="font-size: 1rem"
                >[{{ formatNumber(totalRows) }}]</small
              >
            </h1>
          </b-col>
        </b-row>
        <div class="last-blocks">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <template v-else>
            Filter
            <b-row style="margin-bottom: 1rem">
              <b-col cols="12">
                <b-input-group size="xl" class="mb-2">
                  <b-input-group-prepend is-text>
                    <font-awesome-icon icon="search" />
                  </b-input-group-prepend>
                  <b-form-input
                    id="filterInput"
                    v-model="filter"
                    type="search"
                    :placeholder="$t('pages.blocks.search_placeholder')"
                  />
                </b-input-group>
              </b-col>
            </b-row>
            <div class="table-responsive">
              <b-table striped hover :fields="fields" :items="blocks">
                <template #cell(block_number)="data">
                  <p class="mb-0">
                    <nuxt-link
                      v-b-tooltip.hover
                      :to="
                        localePath(
                          `/block?blockNumber=${data.item.block_number}`
                        )
                      "
                      :title="$t('common.block_details')"
                    >
                      #{{ formatNumber(data.item.block_number) }}
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(timestamp)="data">
                  <p class="mb-0">
                    {{ fromNow(data.item.timestamp) }}
                  </p>
                </template>
                <template #cell(block_author)="data">
                  <p class="mb-0">
                    <Identicon :address="data.item.block_author" :size="22" />
                    <nuxt-link
                      :to="localePath(`/validator/${data.item.block_author}`)"
                    >
                      <span v-if="data.item.block_author_name">{{
                        data.item.block_author_name
                      }}</span>
                      <span v-else>{{
                        shortAddress(data.item.block_author)
                      }}</span>
                    </nuxt-link>
                  </p>
                </template>
                <template #cell(finalized)="data">
                  <p v-if="data.item.finalized" class="mb-0">
                    <font-awesome-icon icon="check" class="text-success" />
                    {{ $t('common.finalized') }}
                  </p>
                  <p v-else class="mb-0">
                    <font-awesome-icon icon="spinner" class="text-light" spin />
                    {{ $t('common.processing') }}
                  </p>
                </template>
                <template #cell(block_hash)="data">
                  <p class="mb-0">
                    {{ shortHash(data.item.block_hash) }}
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
          </template>
        </div>
      </b-container>
    </section>
  </div> -->
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { config, paginationOptions } from '@/frontend.config.js'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import TableComponent from '@/components/more/TableComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'

export default {
  	layout: 'AuthLayout',
  components: {
    Loading,
	HeaderComponent,
	TableComponent,
	SearchSection,
  },
  mixins: [commonMixin],
  computed:
  {
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
	}
  },
  data() {
    return {
		options:
		{
			variant: 'i-fourth',
		},
      loading: true,
      filter: '',
      blocks: [],
      paginationOptions,
      perPage: localStorage.paginationOptions
        ? parseInt(localStorage.paginationOptions)
        : 10,
      currentPage: 1,
      totalRows: 1,
      fields: [
        {
          key: 'block_number',
          label: this.$t('pages.blocks.block_number'),
          sortable: false,
		  variant: 'i-fourth',
		  class: 'important py-3'
        },
        {
          key: 'finalized',
          label: this.$t('pages.blocks.finalized'),
          sortable: false,
        },
        {
          key: 'timestamp',
          label: this.$t('pages.blocks.timestamp'),
          sortable: false,
        },
        {
          key: 'block_hash',
          label: this.$t('pages.blocks.block_hash'),
          sortable: false,
        },
        {
          key: 'total_extrinsics',
          label: this.$t('pages.blocks.total_extrinsics'),
          sortable: false,
        },
        {
          key: 'total_events',
          label: this.$t('pages.blocks.total_events'),
          sortable: false,
        },
        {
          key: 'block_author',
          label: this.$t('pages.blocks.block_author'),
          sortable: false,
		  class: "text-left"
        },
      ],
    }
  },
  head() {
    return {
      title: this.$t('pages.blocks.head_title', {
        networkName: config.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.blocks.head_content', {
            networkName: config.name,
          }),
        },
      ],
    }
  },
  methods: {
    setPageSize(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks(
            $blockNumber: bigint
            $perPage: Int!
            $offset: Int!
          ) {
            block(
              limit: $perPage
              offset: $offset
              where: { block_number: { _eq: $blockNumber } }
              order_by: { block_number: desc }
            ) {
              block_number
              block_author
              block_author_name
              finalized
              block_hash
              total_extrinsics
              total_events
              timestamp
            }
          }
        `,
        variables() {
          return {
            blockNumber: this.filter ? parseInt(this.filter) : undefined,
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
        },
        result({ data }) {
          this.blocks = data.block
          if (this.filter) {
            this.totalRows = this.blocks.length
          }
          this.loading = false
        },
      },
      totalBlocks: {
        query: gql`
          subscription total {
            total(where: { name: { _eq: "blocks" } }, limit: 1) {
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
    },
  },
}
</script>

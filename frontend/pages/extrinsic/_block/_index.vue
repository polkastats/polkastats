<template>

	<main>
		<section v-if="loading" class="section text-center py-4">
			<Loading />
		</section>
		<section v-else-if="!parsedExtrinsic" class="section text-center">
			<h1>{{ $t('pages.extrinsic.extrinsic_not_found') }}</h1>
		</section>
		<template v-else>
			<header-component>
				<search-section :title="$t('pages.extrinsic.extrinsic')" :subtitle="blockNumber + '-' + extrinsicIndex" />
			</header-component>
			
			<Extrinsic :extrinsic="parsedExtrinsic" />
			<ExtrinsicEvents
				:block-number="parseInt(blockNumber)"
				:extrinsic-index="parseInt(extrinsicIndex)"
			/>
		</template>
	</main>

  <!-- <div>
    <section>
      <b-container class="extrinsic-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!parsedExtrinsic">
          <h1 class="text-center">
            {{ $t('pages.extrinsic.extrinsic_not_found') }}
          </h1>
        </template>
        <template v-else>
          <div class="card mt-4 mb-3">
            <div class="card-body">
              <h4 class="text-center mb-4">
                {{ $t('pages.extrinsic.extrinsic') }} {{ blockNumber }}-{{
                  extrinsicIndex
                }}
              </h4>
              <Extrinsic :extrinsic="parsedExtrinsic" />
            </div>
          </div>
          <extrinsic-events
            :block-number="parseInt(blockNumber)"
            :extrinsic-index="parseInt(extrinsicIndex)"
          />
        </template>
      </b-container>
    </section>
  </div> -->
</template>
<script>
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import ExtrinsicEvents from '@/components/ExtrinsicEvents.vue'
import { config } from '@/frontend.config.js'
import HeaderComponent from '@/components/more/headers/HeaderComponent.vue'
import SearchSection from '@/components/more/headers/SearchSection.vue'

export default {
	layout: 'AuthLayout',
  components: {
    Loading,
    ExtrinsicEvents,
	HeaderComponent,
	SearchSection
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      blockNumber: this.$route.params.block,
      extrinsicIndex: this.$route.params.index,
      parsedExtrinsic: undefined,
    }
  },
  head() {
    return {
      title: this.$t('pages.extrinsic.head_title', {
        networkName: config.name,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.extrinsic.head_content', {
            networkName: config.name,
          }),
        },
      ],
    }
  },
  watch: {
    $route() {
      this.blockNumber = this.$route.params.block
      this.extrinsicIndex = this.$route.params.index
    },
  },
  apollo: {
    extrinsic: {
      query: gql`
        query extrinsic($block_number: bigint!, $extrinsic_index: Int!) {
          extrinsic(
            where: {
              block_number: { _eq: $block_number }
              extrinsic_index: { _eq: $extrinsic_index }
            }
          ) {
            block_number
            extrinsic_index
            is_signed
            signer
            section
            method
            args
            args_def
            hash
            doc
            fee_info
            fee_details
            success
            error_message
            timestamp
          }
        }
      `,
      skip() {
        return !this.blockNumber || !this.extrinsicIndex
      },
      variables() {
        return {
          block_number: this.blockNumber,
          extrinsic_index: this.extrinsicIndex,
        }
      },
      result({ data }) {
        this.parsedExtrinsic = data.extrinsic[0]
        this.loading = false
      },
    },
  },
}
</script>

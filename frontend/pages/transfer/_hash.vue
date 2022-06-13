<template>

	<main>
		<section v-if="loading" class="section text-center py-4">
			<Loading />
		</section>
		<section v-else-if="!transfer" class="section text-center">
			<h1>{{ $t('pages.transfer.not_found') }}</h1>
		</section>
		<template v-else>
			<header-component>
				<search-section :title="$t('pages.transfer.title')" :subtitle="shortHash(hash)" />
			</header-component>
			
			<Transfer :transfer="transfer" />
			<ExtrinsicEvents
				:block-number="parseInt(transfer.block_number)"
				:extrinsic-index="parseInt(transfer.extrinsic_index)"
			/>
		</template>

	</main>


  <!-- <div>
    <section>
      <b-container class="transfer-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <template v-else-if="!transfer">
          <h1 class="text-center">{{ $t('pages.transfer.not_found') }}</h1>
        </template>
        <template v-else>
          <div class="card mt-4 mb-3">
            <div class="card-body">
              <h4 class="text-center mb-4">
                {{ $t('pages.transfer.title') }} {{ shortHash(hash) }}
              </h4>
              <Transfer :transfer="transfer" />
              <ExtrinsicEvents
                :block-number="parseInt(transfer.block_number)"
                :extrinsic-index="parseInt(transfer.extrinsic_index)"
              />
            </div>
          </div>
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
      hash: this.$route.params.hash,
      transfer: undefined,
    }
  },
  head() {
    return {
      title: this.$t('pages.transfer.head_title', {
        networkName: config.name,
        hash: this.hash,
      }),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('pages.transfer.head_content', {
            networkName: config.name,
            hash: this.hash,
          }),
        },
      ],
    }
  },
  watch: {
    $route() {
      this.hash = this.$route.params.hash
    },
  },
  apollo: {
    transfer: {
      query: gql`
        query transfer($hash: String!) {
          transfer(where: { hash: { _eq: $hash } }) {
            block_number
            hash
            extrinsic_index
            section
            method
            source
            destination
            amount
            fee_amount
            success
            error_message
            timestamp
          }
        }
      `,
      skip() {
        return !this.hash
      },
      variables() {
        return {
          hash: this.hash,
        }
      },
      result({ data }) {
        this.transfer = data.transfer[0]
        this.loading = false
      },
    },
  },
}
</script>

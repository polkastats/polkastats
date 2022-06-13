<template>

	<rating-item :title="$t('components.identity.title')" :score="rating">
		
		<nuxt-link
			v-b-tooltip.hover
			to="/help/metrics#identity"
			:title="$t('components.identity.help')"
			class="legend-link h6"
		>
			<font-awesome-icon icon="question-circle" />
		</nuxt-link>

		<div class="my-2">
			<template v-if="rating === 3">{{ $t('components.identity.description_1') }}</template>
			<template v-else-if="rating === 2">{{ $t('components.identity.description_2') }}</template>
			<template v-else-if="rating === 1">{{ $t('components.identity.description_3') }}</template>
			<template v-else>{{ $t('components.identity.description_4') }}</template>
		</div>

		<div specs class="text-left overflow-hidden mt-2">
			<spec-item v-if="identity.legal" title="Legal">
				{{ identity.legal }}
			</spec-item>
			<spec-item v-if="identity.email" title="Email">
				<a :href="`mailto:${identity.email}`" target="_blank">
					{{ identity.email }}
				</a>
			</spec-item>
			<spec-item v-if="identity.web" title="Web">
				<a 
					:href="identity.web.indexOf('://') === -1
					? 'http://' + identity.web
					: identity.web" target="_blank"
				>
					{{
						identity.web.indexOf('://') === -1
						? 'http://' + identity.web
						: identity.web
					}}
				</a>
			</spec-item>
			<spec-item v-if="identity.twitter" title="Twitter">
				<a
					:href="`https://twitter.com/${identity.twitter.substring(1)}`"
					target="_blank"
				>
					{{ identity.twitter }}
				</a>
			</spec-item>
			<spec-item v-if="identity.riot" title="Element">
				<a href="https://app.element.io/" target="_blank">
					{{ identity.riot }}
				</a>
			</spec-item>
		</div>

	</rating-item>

  <!-- <div class="metric h-100">
    <div class="row mb-4">
      <div class="col-8">
        <h5 class="mb-0">
          {{ $t('components.identity.title') }}
          <nuxt-link
            v-b-tooltip.hover
            to="/help/metrics#identity"
            :title="$t('components.identity.help')"
          >
            <font-awesome-icon
              icon="question-circle"
              class="d-inline-block"
              style="font-size: 1rem"
            />
          </nuxt-link>
        </h5>
      </div>
      <div class="col-4 text-right text-success">
        <Rating key="identity" :rating="rating" />
      </div>
    </div>
    <div class="description">
      <p v-if="rating === 3">
        {{ $t('components.identity.description_1') }}
      </p>
      <p v-else-if="rating === 2">
        {{ $t('components.identity.description_2') }}
      </p>
      <p v-else-if="rating === 1">
        {{ $t('components.identity.description_3') }}
      </p>
      <p v-else>{{ $t('components.identity.description_4') }}</p>
    </div>
    <div v-if="identity.legal" class="row">
      <div class="col-md-3">Legal:</div>
      <div class="col-md-9">
        {{ identity.legal }}
      </div>
    </div>
    <div v-if="identity.email" class="row">
      <div class="col-md-3">Email:</div>
      <div class="col-md-9">
        <a :href="`mailto:${identity.email}`" target="_blank">
          {{ identity.email }}
        </a>
      </div>
    </div>
    <div v-if="identity.web" class="row">
      <div class="col-md-3">Web:</div>
      <div class="col-md-9">
        <a
          :href="
            identity.web.indexOf('://') === -1
              ? 'http://' + identity.web
              : identity.web
          "
          target="_blank"
        >
          {{
            identity.web.indexOf('://') === -1
              ? 'http://' + identity.web
              : identity.web
          }}
        </a>
      </div>
    </div>
    <div v-if="identity.twitter" class="row">
      <div class="col-md-3">Twitter:</div>
      <div class="col-md-9">
        <a
          :href="`https://twitter.com/${identity.twitter.substring(1)}`"
          target="_blank"
        >
          {{ identity.twitter }}
        </a>
      </div>
    </div>
    <div v-if="identity.riot" class="row">
      <div class="col-md-3">Element:</div>
      <div class="col-md-9">
        <a href="https://app.element.io/" target="_blank">
          {{ identity.riot }}
        </a>
      </div>
    </div>
  </div> -->
</template>

<script>
// import Rating from '@/components/staking/Rating.vue'
import RatingItem from '@/components/more/RatingItem.vue'
import SpecItem from '@/components/more/SpecItem.vue'

export default {
  components: {
    // Rating,
	RatingItem,
	SpecItem
  },
  props: {
    identity: {
      type: Object,
      default: () => {},
    },
    rating: {
      type: Number,
      default: () => 0,
    },
  },
}
</script>

<template>
  <div class="metric h-100">
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
  </div>
</template>

<script>
import Rating from '@/components/staking/Rating.vue'

export default {
  components: {
    Rating,
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

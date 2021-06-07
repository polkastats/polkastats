<template>
  <div id="sidebar-wrapper">
    <div class="sidebar-heading text-center mb-4">
      <nuxt-link to="/" class="navbar-brand" :title="config.title">
        <img class="logo mb-1" :src="config.logo" /><br />
        <span style="font-size: 0.75rem">Validator Resource Center</span>
      </nuxt-link>
    </div>
    <div class="list-group list-group-flush text-center">
      <nuxt-link class="nav-link mb-4" to="/">
        <font-awesome-icon
          icon="chart-line"
          style="display: block; font-size: 3rem; margin: 0 auto 0.5rem"
        />
        Dashboard
      </nuxt-link>
      <nuxt-link class="nav-link mb-4" to="/ranking">
        <font-awesome-icon
          icon="table"
          style="display: block; font-size: 3rem; margin: 0 auto 0.5rem"
        />
        Ranking
      </nuxt-link>
      <nuxt-link class="nav-link mb-4" to="/import">
        <font-awesome-icon
          icon="file-import"
          style="display: block; font-size: 3rem; margin: 0 auto 0.5rem"
        />
        Import
      </nuxt-link>
      <nuxt-link class="nav-link mb-4" to="/nominate">
        <font-awesome-icon
          icon="hands-helping"
          style="display: block; font-size: 3rem; margin: 0 auto 0.5rem"
        />
        Nominate
      </nuxt-link>
      <nuxt-link class="nav-link mb-4" to="/help">
        <font-awesome-icon
          icon="life-ring"
          style="display: block; font-size: 3rem; margin: 0 auto 0.5rem"
        />
        Help
      </nuxt-link>
    </div>
  </div>
</template>

<script>
import { config } from '@/config.js'
export default {
  data() {
    return {
      config,
    }
  },
}
</script>

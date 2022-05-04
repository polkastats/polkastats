<template>
	<section>
		<div
			v-if="config.coinZillaZone"
			class="coinzilla"
			:data-zone="`C-${config.coinZillaZone}`"
		></div>
	</section>
</template>

<script>
import { config } from '@/frontend.config.js'
export default {
  data() {
    return {
      config,
      window,
    }
  },
  created() {
    if (config.coinZillaZone) {
      this.window.coinzilla_display = this.window.coinzilla_display || []
      // eslint-disable-next-line camelcase
      const c_display_preferences = {}
      c_display_preferences.zone = config.coinZillaZone
      c_display_preferences.width = '728'
      c_display_preferences.height = '90'
      this.window.coinzilla_display.push(c_display_preferences)
    }
  },
}
</script>

<style>
.coinzilla {
  margin: 0 auto;
  display: block !important;
}
</style>

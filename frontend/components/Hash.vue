<template>
  <fragment v-if="unclass">
	<spec-item >
		<span v-if="short">{{ shortHash(hash) }}</span>
		<span v-else>{{ hash }}</span>
	</spec-item>
	<spec-item variant="i-third" sm="2">
		<b-button class="p-0 text-i-fifth" size="sm" variant="transparent" v-clipboard:copy="hash" @click="showToast">
			<font-awesome-icon icon="copy" /> Copy
		</b-button>
	</spec-item>
  </fragment>
  <div v-else class="hash d-inline-block">
    <span v-if="short">{{ shortHash(hash) }}</span>
    <span v-else>{{ hash }}</span>
    <span v-clipboard:copy="hash" @click="showToast">
      <font-awesome-icon icon="copy" class="copy" />
    </span>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import SpecItem from '@/components/more/SpecItem.vue'
import { Fragment } from 'vue-fragment'

export default {
  mixins: [commonMixin],
  components: { SpecItem, Fragment },
  props: {
    hash: {
      type: String,
      default: '',
    },
    short: {
      type: Boolean,
      default: false,
    },
	unclass: {
      type: Boolean,
    },
  },
  methods: {
    showToast() {
      this.$bvToast.toast(this.hash, {
        title: 'Hash copied to clipboard!',
        variant: 'success',
        autoHideDelay: 5000,
        appendToast: false,
      })
    },
  },
}
</script>

<style>
.hash .copy {
  cursor: pointer;
  margin-left: 0.2rem;
}
</style>

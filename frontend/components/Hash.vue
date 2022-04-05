<template>
  <div class="hash d-inline-block">
    <span v-if="short">{{ shortHash(hash) }}</span>
    <span v-else>{{ hash }}</span>
    <span v-clipboard:copy="hash" @click="showToast">
      <font-awesome-icon icon="copy" class="copy" />
    </span>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
export default {
  mixins: [commonMixin],
  props: {
    hash: {
      type: String,
      default: '',
    },
    short: {
      type: Boolean,
      default: false,
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

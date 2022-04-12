<template>
  <!-- Filter -->
  <form @submit="doSearch">
      <p>
		<i icon="search"></i>
        <input
          id="searchInput"
          v-model="searchInput"
          type="text"
          :placeholder="$t('components.search.caption')"
        />
      </p>
  </form>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      searchInput: '',
    }
  },
  methods: {
    async doSearch(event) {
		event.preventDefault();
        if (await this.isExtrinsicHash(this.searchInput)) {
          this.$router.push({
            path: this.localePath(`/extrinsic/${this.searchInput}`),
          })
        } else if (await this.isBlockHash(this.searchInput)) {
          this.$router.push({
            path: this.localePath(`/block/${this.searchInput}`),
          })
        } else if (this.isAddress(this.searchInput)) {
          this.$router.push({
            path: this.localePath(`/account/${this.searchInput}`),
          })
        } else if (this.isBlockNumber(this.searchInput)) {
          this.$router.push({
            path: this.localePath(`/block?blockNumber=${this.searchInput}`),
          })
        }
    },
  },
}
</script>

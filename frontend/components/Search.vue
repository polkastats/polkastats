<template>
  <!-- Filter -->
  <form @submit="doSearch">
      <p>
		<i icon="search"></i>
        <input
          id="searchInput"
          v-model="searchInput"
          type="text"
          placeholder="Search by block number, block hash, extrinsic hash or account address"
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
            path: `/extrinsic/${this.searchInput}`,
          })
        } else if (await this.isBlockHash(this.searchInput)) {
          this.$router.push({
            path: `/block/${this.searchInput}`,
          })
        } else if (this.isAddress(this.searchInput)) {
          this.$router.push({
            path: `/account/${this.searchInput}`,
          })
        } else if (this.isBlockNumber(this.searchInput)) {
          this.$router.push({
            path: `/block?blockNumber=${this.searchInput}`,
          })
        }
    },
  },
}
</script>

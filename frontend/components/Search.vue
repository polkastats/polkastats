<template>
  <!-- Filter -->
  <b-row class="mb-4">
    <b-col cols="12">
      <b-input-group size="sm" class="mb-2">
        <b-input-group-prepend is-text>
          <font-awesome-icon icon="search" />
        </b-input-group-prepend>
        <b-form-input
          id="searchInput"
          v-model="searchInput"
          type="search"
          placeholder="Search by block number, block hash, extrinsic hash or account address"
          @keydown.native="doSearch"
        />
      </b-input-group>
    </b-col>
  </b-row>
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
      if (event.keyCode === 13) {
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
      }
    },
  },
}
</script>

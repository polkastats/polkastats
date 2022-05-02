<template>
  <form class="col" @submit="doSearch">
	  <b-input-group>
		<b-form-input v-model="searchInput" :placeholder="$t('components.search.caption')" class="text-i-fifth rounded" control="text" variant="i-fourth" size="sm" />
			<b-input-group-append class="mr-2" p-absolute="right">
				<font-awesome-icon icon="search" class="text-i-fourth" />
		</b-input-group-append>
	  </b-input-group>
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

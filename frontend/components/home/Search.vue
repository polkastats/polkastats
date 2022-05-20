<template>
  <form class="col" @submit="doSearch">
	  <input-control
			:placeholder="$t('components.search.caption')"
			icon="search"
			variant="i-fourthB"
			v-model="searchInput"
			class="text-i-fifth"
		/>
  </form>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import InputControl from '@/components/more/InputControl.vue'

export default {
  mixins: [commonMixin],
  components: { InputControl },
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

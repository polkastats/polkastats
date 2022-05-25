<template>
  <div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import { formatBalance } from '@polkadot/util'
import Loading from '@/components/Loading.vue'

export default {
  components: {
    Loading,
  },
  data() {
    return {
      loading: true,
      graduates: 0,
      tokenRewarded: 0,
      feedback: 0,
      showBanner: true,
      edpLink: '',
      formatBalance,
    }
  },
  computed: {
    formatNumber() {
      const formatter = Intl.NumberFormat('en', { notation: 'compact' })
      return formatter.format(this.tokenRewarded)
    },
  },
  apollo: {
    $subscribe: {
      banner: {
        query: gql`
          subscription edp {
            edp(where: { key: { _eq: "banner" } }) {
              value
            }
          }
        `,
        result({ data }) {
          if (data.edp.length === 0) {
            this.loading = false
            this.showBanner = false
          } else {
            this.metrics = data.edp[0].value
            this.showBanner = data.edp[0].value.show
            this.tokenRewarded = data.edp[0].value.tokensRewarded
            this.graduates = data.edp[0].value.cereBootcampGraduatesNumber
            this.feedback = data.edp[0].value.feedbackPercentage
            this.edpLink = data.edp[0].value.onClickLink
            this.loading = false
          }
        },
      },
    },
  },
}
</script>

<style>
.banner {
  background-image: url('../static/img/edp_banner_bg.png');
  height: 200px;
  margin-top: -5px;
  margin-bottom: 30px;
  border-radius: 10px;
  display: none;
  margin-right: -1px;
  margin-left: -1px;
}

.child.left {
  width: 8%;
  display: flex;
}

.child.middle {
  width: 67%;
  display: flex;
  justify-content: flex-start;
}

.child.right {
  width: 25%;
  display: flex;
}

.flex {
  display: flex;
  justify-content: center;
  align-items: center;
}

.rectangle {
  height: 30px;
  background: linear-gradient(90deg, #c9529e 0%, #a04799 33.85%, #5e4186 100%);
  box-shadow: 0 0 4px 4px rgba(121, 119, 119, 0.25);
  border-radius: 90px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 0;
  align-items: center;
  color: white;
}

.value {
  margin-left: 80px;
}

.banner span {
  padding: 0 10px;
}

.rectangle.first {
  width: 80%;
}

.rectangle.second {
  width: 85%;
  margin: 25px 0;
}

.content {
  padding: 0 15px;
  align-content: flex-start;
  width: 100%;
}

.button {
  width: 100%;
  text-align: center;
  padding: 10px 10px;
  justify-content: flex-start;
  margin-right: 25px;
}

a {
  text-decoration: none !important;
  width: 100% !important;
}

@media (min-width: 992px) {
  .banner {
    display: flex;
    font-size: 0.6rem;
  }
}

@media (min-width: 1200px) {
  .banner {
    font-size: 0.8rem;
  }
}
</style>

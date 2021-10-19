<template>
  <div v-if="showBanner" class="banner row">
    <div class="flex child left column">
      <div class="cere-logo">
        <img
          src="../static/img/cere_logo_edp.png"
          alt="Cere Logo"
          class="img"
          height="60px"
        />
      </div>
    </div>
    <div class="flex child middle column">
      <div class="content">
        <div class="rectangle first">
          <span>Total tokens rewarded to EDP community members</span>
          <span class="value">{{ formatNumber }} CERE tokens</span>
        </div>
        <div class="rectangle second">
          <span>
            Number of EDP community members who finished Cere Bootcamp
          </span>
          <span class="value">{{ graduates }}</span>
        </div>
        <div class="rectangle third">
          <span>
            {{ feedback }}% of the EDP community members think the Cere Bootcamp
            is ‘interesting’.
          </span>
        </div>
      </div>
    </div>
    <div class="flex child right column">
      <a :href="edpLink" target="_blank">
        <div class="button">
          Click here to find out more about the EDP community
        </div>
      </a>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import { formatBalance } from '@polkadot/util'

export default {
  data() {
    return {
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
      metrics: {
        query: gql`
          subscription edp {
            edp {
              value
            }
          }
        `,
        result({ data }) {
          this.metrics = data.edp[0].value
          this.showBanner = data.edp[0].value.banner
          this.tokenRewarded = data.edp[0].value.tokensRewarded
          this.graduates = data.edp[0].value.cereBootcampGraduateNumber
          this.feedback = data.edp[0].value.challengingAndInterstingPercentage
          this.edpLink = data.edp[0].value.edpLink
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
  margin-top: -15px;
  margin-bottom: 30px;
  border-radius: 10px;
  display: none;
}

.child.left {
  width: 10%;
  display: flex;
}

.child.middle {
  width: 70%;
  display: flex;
  justify-content: flex-start;
}

.child.right {
  width: 20%;
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
  width: 75%;
}

.rectangle.second {
  width: 80%;
  margin: 25px 0;
}

.rectangle.third {
  width: 90%;
}

.content {
  padding: 0 15px;
  align-content: flex-start;
  width: 100%;
}

.button {
  width: 150px;
  text-align: center;
  box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
  background-color: white;
  border-radius: 10px;
  padding: 10px 10px;
  justify-content: flex-start;
}

a {
  text-decoration: none !important;
}

@media (min-width: 1024px) {
  .banner {
    display: flex;
    font-size: 0.6rem;
  }
}

@media (min-width: 1280px) {
  .banner {
    font-size: 0.8rem;
  }
}
</style>

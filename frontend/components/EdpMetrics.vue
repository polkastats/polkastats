<template>
  <div v-if="showBanner" class="banner">
    <div class="flex col child left">
      <div class="cere-logo">
        <img
          src="../static/img/cere_logo_edp.png"
          alt="Cere Logo"
          class="img"
          height="60px"
        />
      </div>
    </div>
    <div class="flex col child right">
      <div class="content">
        <div class="rectangle first">
          <span>Number of cere bootcamp graduated</span>
          <span class="value">67</span>
        </div>
        <div class="rectangle second">
          <span>Total tokens rewarded</span>
          <span class="value">97K+ Cere tokens</span>
        </div>
        <div class="rectangle third">
          <span>Cere bootcamp Participants feedback</span>
          <span class="value"
            >90% of participants think this is Challenging and Interesting</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '../mixins/commonMixin.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      metrics: {},
      showBanner: true,
    }
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
  flex: 15;
}

.child.right {
  flex: 85;
  display: flex;
  flex-direction: column;
}

.flex {
  display: flex;
  justify-content: center;
  align-items: center;
}

.col {
  flex-direction: column;
}

.rectangle {
  height: 30px;
  background: linear-gradient(90deg, #c9529e 0%, #a04799 33.85%, #5e4186 100%);
  box-shadow: 0 0 4px 4px rgba(121, 119, 119, 0.25);
  border-radius: 90px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 0 10px;
  align-items: center;
  color: white;
}

.value {
  margin-left: 80px;
}

.banner span {
  padding: 0 5px;
}

.flex.content {
  padding: 10px;
  flex-direction: column;
}

.rectangle.first {
  width: 50%;
}

.rectangle.second {
  width: 65%;
  margin: 25px 0;
}

@media (min-width: 1024px) {
  .banner {
    display: flex;
    font-size: 0.7rem;
  }
  .rectangle.first {
    width: 60%;
  }
}

@media (min-width: 1280px) {
  .banner {
    font-size: 0.9rem;
  }
  .rectangle.first {
    width: 50%;
  }
}
</style>

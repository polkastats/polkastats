import { Bar, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: Bar,
  mixins: [reactiveProp],
  props: ['options', 'chartData'],
  mounted() {
    this.renderChart(this.chartData, this.options)
  },
  watch: {
    options() {
      this.renderChart(this.chartData, this.options)
    },
  },
}

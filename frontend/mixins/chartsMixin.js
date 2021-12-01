import { gql } from 'graphql-tag'
import Constants from '@/constants/charts.js'
export default {
  methods: {
    async signedExtrinsicDayCount(queryLimit) {
      const client = this.$apollo.provider.defaultClient
      const query = gql`
        query extrinsicsDayCount {
          signed_extrinsics_per_day_view(
            limit: ${queryLimit}
            order_by: { when: desc }
          ) {
            volume
            when
          }
        }
      `
      const { data } = await client.query({ query })
      const countArray = []
      const labelArray = []
      data.signed_extrinsics_per_day_view.forEach((count) => {
        countArray.push(count.volume)
        labelArray.push(count.when)
      })
      return {
        count: countArray.reverse(),
        label: labelArray.reverse(),
      }
    },
    async signedExtrinsicMonthCount(queryLimit) {
      const client = this.$apollo.provider.defaultClient
      const query = gql`
        query extrinsicsMonthCount {
          signed_extrinsics_per_month_view(limit: ${queryLimit}) {
            volume
            when
          }
        }
      `
      const { data } = await client.query({ query })
      const countArray = []
      const labelArray = []
      data.signed_extrinsics_per_month_view.forEach((count) => {
        countArray.push(count.volume)
        labelArray.push(count.when)
      })
      return {
        count: countArray,
        label: labelArray,
      }
    },
    cumulativeValue(value) {
      return value.map(
        (
          (sum) => (value) =>
            (sum += value)
        )(0)
      )
    },
    getExtrinsicsChartData(label, data) {
      return {
        labels: label,
        datasets: [
          {
            labels: 'Extrinsics Count',
            data,
            backgroundColor: '#BD32A7',
            borderColor: '#BD32A7',
            hoverBackgroundColor: 'rgba(255, 255, 255, 0.8)',
            fill: false,
            showLine: true,
          },
        ],
      }
    },
    getChartOptions(title, yAxesLabel) {
      return {
        responsive: true,
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: title,
          fontSize: 20,
          position: 'top',
          fontColor: '#000',
          fontStyle: 'bold',
          lineHeight: 2,
        },
        tooltips: {
          backgroundColor: '#000000',
        },
        scales: {
          xAxes: [
            {
              type: 'time',
              time: {
                displayFormats: {
                  week: 'D. MMM',
                  day: 'D. MMM',
                  month: "MMM 'YY",
                },
              },
              distribution: 'series',
              gridLines: {
                display: true,
                color: 'rgba(200, 200, 200, 0.4)',
              },
              ticks: {
                fontSize: 12,
                padding: 10,
              },
              scaleLabel: {
                display: false,
                labelString: 'Date',
                padding: 10,
                fontSize: 12,
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                suggestedMin: 0,
                steps: 10,
                fontSize: 12,
                padding: 10,
              },
              gridLines: {
                display: true,
                color: 'rgba(200, 200, 200, 0.4)',
              },
              scaleLabel: {
                display: true,
                labelString: yAxesLabel,
              },
            },
          ],
        },
        animation: {
          duration: 300,
        },
      }
    },
    getDefaultFilterButtons() {
      return [
        {
          name: Constants.oneMonth,
          method: this.month,
        },
        {
          name: Constants.threeMonth,
          method: this.months,
        },
        {
          name: Constants.oneYear,
          method: this.year,
        },
        {
          name: Constants.max,
          method: this.max,
        },
      ]
    },
  },
}

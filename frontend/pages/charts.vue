<template>
  <div>
    <section>
      <b-container class="main py-5">
        <b-row class="mb-2">
          <b-col cols="12">
            <h1>{{ $t('pages.charts.title') }}</h1>
          </b-col>
        </b-row>
        <b-col class="col-xl-12 mb-5">
          <SignedExtrinsicsCumulativeChart />
        </b-col>
        <b-col class="col-xl-12 mb-5">
          <SignedExtrinsicsBarChart />
        </b-col>
      </b-container>
    </section>
  </div>
</template>

<script>
import SignedExtrinsicsCumulativeChart from '@/components/charts/SignedExtrinsicsCumulativeChart.vue'
import SignedExtrinsicsBarChart from '@/components/charts/SignedExtrinsicsBarChart.vue'

export default {
  components: {
    SignedExtrinsicsCumulativeChart,
    SignedExtrinsicsBarChart,
  },
  head() {
    return {
      title: this.$t('pages.charts.head_title'),
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Cere Stats',
        },
      ],
    }
  },
}
</script>


<template>
	<section class="section chart">
		<header>
			<h1 v-if="title">{{ title }}</h1>
			<h2 v-if="subtitle">{{ subtitle }}</h2>
		</header>
		<TransfersChart />
	</section>
</template>

<script>
import TransfersChart from '@/components/home/TransfersChart.vue'

export default {
	components: { TransfersChart },
	data()
	{
		return {
			title: 'Balance Transfers',
			subtitle: this.$t('components.transfers_chart.title'),
		}
	}
}
</script>
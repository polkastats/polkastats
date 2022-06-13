
<template>
	<section class="section section-chart text-center" color="i-third-1">
		<header class="header-block mb-4" size="sm">
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
	computed:
	{
		title(){ return 'Balance Transfers' },
		subtitle(){ return this.$t('components.transfers_chart.title') },
	}
}
</script>
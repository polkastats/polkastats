
<template>
	<section class="section chart" color="i-third">
		<header class="mb-4">
			<h1 v-if="title" class="h1">{{ title }}</h1>
			<h2 v-if="subtitle" class="h6">{{ subtitle }}</h2>
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
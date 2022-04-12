
<template>
	<section class="chart">
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

<style lang="scss" scoped>
@use '/assets/scss/polkadot/variables/colors/colors.scss' as COLOR;

section
{
	text-align: center;
	background-color: rgba(COLOR.$third, 0.1);

	> header
	{
		text-align: center;
		margin: 1em;

		> h1
		{
			font-size: 3.2em;
			font-weight: 500;
		}

		> h2
		{
			font-size: 1.6em;
			font-weight: 500;
		}
	}

	> div
	{
		max-height: 25em;
		margin: auto;
	}

}

</style>


<template>
	<article v-if="rating" class="pkd-card p-3 text-center h-100" :variant="rating.variant">
		<header>
			<h2>
				<font-awesome-icon :icon="rating.icon" />
			</h2>
			<b-badge variant="i-fourth" class="xtext-md font-weight-normal text-uppercase my-1">
				{{ rating.name }}
			</b-badge>
			<h1 class="h6 mb-2" v-if="title">
				<font-awesome-icon v-if="icon" :icon="icon" class="mr-1" />
				{{ title }}
			</h1>
		</header>

		<slot />
	</article>
</template>

<script>

export default {
	props:
	{
		score: { type: Number, required: true },
		variant: { type: String, default: 'i-fifth' },
		color: { type: String, default: 'i-fourth' },
		icon: String,
		title: String,
	},
	computed:
	{
		scores()
		{
			return [
				{ name: this.$t('components.rating.bad'), icon: 'times', variant: 'i-danger' },
				{ name: this.$t('components.rating.neutral'), icon: 'check', variant: 'warning' },
				{ name: this.$t('components.rating.good'), icon: 'check', variant: 'i-success' },
				{ name: this.$t('components.rating.very_good'), icon: 'check', variant: 'i-successB' },
			]
		},
		rating()
		{
			if(this.scores)
				return this.scores[this.score];
		}
	}
}
</script>
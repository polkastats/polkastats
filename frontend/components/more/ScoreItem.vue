
<template>
	<p class="score-item col-sm-6 col-md-6 col-lg-3">
		<em class="text-i-fourthB">
			<font-awesome-icon :icon="icon" class="text-i-fifth mr-1" />
			{{ title }}
		</em>
		<strong class="text-i-fifth ml-3">
			<nuxt-link v-if="link" v-b-tooltip.hover :to="link" :title="description">
				{{ value }}
				<slot />
			</nuxt-link>
			<template v-else>
				{{ value }}
				<slot />
			</template>
		</strong>
	</p>
</template>

<script>
export default {
	props: ['title', 'description', 'value', 'link', 'icon']
}
</script>

<style scoped lang="scss">


</style>
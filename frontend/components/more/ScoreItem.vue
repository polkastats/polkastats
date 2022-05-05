
<template>
	<p class="score-item col-sm-6 col-md-6 col-lg-3 m-0">
		<strong class="d-block text-uppercase text-i-fourthB">
			<font-awesome-icon :icon="icon" class="text-i-fifth mr-1" />
			{{ title }}
		</strong>
		<em class="h6 d-block text-i-fifth ml-3">
			<nuxt-link v-if="link" v-b-tooltip.hover :to="link" :title="description">
				{{ value }}
				<slot />
			</nuxt-link>
			<template v-else>
				{{ value }}
				<slot />
			</template>
		</em>
	</p>
</template>

<script>
export default {
	props: ['title', 'description', 'value', 'link', 'icon']
}
</script>

<style scoped lang="scss">


</style>
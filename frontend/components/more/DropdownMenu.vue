
<template>
	<i-dropdown tabindex="0" :color="color">
		<span :icon="selected.icon || ''">{{ selected.name }}</span>
		<ul>
			<li v-for="option in options" :key="option.name">
				<a :href="option.link" :icon="option.icon">{{ option.name }}</a>
			</li>
		</ul>
	</i-dropdown>
</template>

<script>
export default {
	props: ['color', 'options', 'value'],
	data()
	{
		return { selected: this.value || this.options[0], focus: false }
	}
}
</script>

<style lang="scss" scoped>
</style>


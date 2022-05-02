
<template>
	<b-nav-item-dropdown v-if="link" :variant="variant" size="sm">
		<template #button-content>
			<span :icon="selected.icon">{{ selected.name }}</span>
			<font-awesome-icon icon="angle-down" />
		</template>
		<b-dropdown-item v-for="option in options" :key="option.name" :href="option.link">
			{{ option.name }}
		</b-dropdown-item>
	</b-nav-item-dropdown>
	<b-dropdown v-else :variant="variant" :variants="variant" size="sm" class="m-0">
		<template #button-content>
			<span :icon="selected.icon">{{ selected.name }}</span>
			<font-awesome-icon icon="angle-down" />
		</template>
		<b-dropdown-item v-for="option in options" :key="option.name" :href="option.link" :icon="option.icon">
			{{ option.name }}
		</b-dropdown-item>
	</b-dropdown>
</template>

<script>
export default {
	props: ['variant', 'options', 'value', 'link'],
	data()
	{
		return { selected: this.value || this.options[0], focus: false }
	}
}
</script>
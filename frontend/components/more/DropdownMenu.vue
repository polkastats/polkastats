
<template>
	<b-nav-item-dropdown v-if="link" :variant="variant" size="sm">
		<template #button-content>
			<span :icon="selected.icon">{{ selected.name }}</span>
			<font-awesome-icon icon="chevron-down" size="sm" />
		</template>
		<b-dropdown-item v-for="option in options" :key="option.name" :to="option.link">
			{{ option.name }}
		</b-dropdown-item>
	</b-nav-item-dropdown>
	<b-dropdown v-else :variant="variant" :variants="variant" size="sm" class="m-0">
		<template #button-content>
			<span :icon="selected.icon">{{ selected.name }}</span>
			<font-awesome-icon icon="chevron-down" size="sm" />
		</template>
		<template v-if="options">
			<!-- FIX: Option click empty error -->
			<b-dropdown-item v-for="option in options" :key="option.name" @click="option.click" :to="option.link" :icon="option.icon">
				{{ option.name }}
			</b-dropdown-item>
		</template>
		<slot v-else />
	</b-dropdown>
</template>

<script>
export default {
	props: ['variant', 'options', 'value', 'link'],
	data()
	{
		let selected = this.value;
		console.log("selected", selected);
		if(!selected)
		{
			if(this.options)
				selected = this.options[0];
			else
				selected = {};
		}
		else if(typeof selected != 'object')
		{
			selected = { name: selected };
		}

		return { selected: selected, focus: false }
	}
}
</script>
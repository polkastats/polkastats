<template>
	<b-nav-item-dropdown v-if="link" :variant="variant" :size="size">
		<template #button-content v-if="selected">
			<span :icon="selected.icon">{{ selected.name }}</span>
			<font-awesome-icon icon="chevron-down" size="sm" />
		</template>
		<b-dropdown-item v-for="option in options" :key="option.name" :to="option.link">
			{{ option.name }}
		</b-dropdown-item>
	</b-nav-item-dropdown>
	<b-dropdown v-else :variant="variant" :variants="variant" :size="size" class="m-0">
		<template #button-content>
			<span v-if="selected" :icon="selected.icon">{{ selected.name }}</span>
			<font-awesome-icon icon="chevron-down" :size="size" />
		</template>
		<template v-if="options">
			<!-- FIX: Option click empty error -->
			<b-dropdown-item v-for="option in options" :key="option.name" @click="option.click" :href="option.href" :to="option.link" :icon="option.icon">
				{{ option.name }}
			</b-dropdown-item>
		</template>
		<slot v-else />
	</b-dropdown>
</template>

<script>
export default {
	props:
	{
		variant: String,
		options: null,
		value: null,
		link: String,
		size: { type: String, default: 'sm' }
	},
	data()
	{
		let selected = this.value;

		if(!this.value)
		{
			if(this.options)
				selected = this.options[0];
			else
				selected = {};
		}
		else if(typeof this.value != 'object')
		{
			selected = { name: selected };
		}

		return { selected: selected, focus: false }
	}
}
</script>
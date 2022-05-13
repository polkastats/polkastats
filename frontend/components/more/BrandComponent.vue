
<template>
	<nuxt-link class="brand" :to="localePath('/')" title="PolkaStats block explorer" :style="{ fontSize: size + 'em' }">
		<img src="/brand/logo.svg" alt="Brand Logo" height="24" logo>
		<img src="/brand/text.svg" alt="Brand Text" height="24" text>
	</nuxt-link>
</template>

<script>
export default {
	props:
	{
		size: { type: Number, default: 1 }
  	}
}
</script>

<template>
	<section class="section-scores blurred p-5" :variant="variant">
		<header class="row mb-5">
			<Search />
		</header>

		<Chain />
	</section>
</template>

<script>
import Chain from '@/components/home/Chain.vue';
import Search from '@/components/home/Search.vue';

export default {
	components: { Search, Chain },
	props:
	{
		variant: { default: 'i-primary' }
	}
}
</script>
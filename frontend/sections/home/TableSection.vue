
<template>
  <section class="tables">
	  <section>
		<LastBlocks />
		<LastTransfers />
	  </section>
	  <section>
		<LastExtrinsics />
		<LastEvents />
	  </section>
  </section>
</template>

<script>
import LastBlocks from '@/components/LastBlocks.vue'
import LastTransfers from '@/components/LastTransfers.vue'
import LastExtrinsics from '@/components/LastExtrinsics.vue'
import LastEvents from '@/components/LastEvents.vue'

export default {
	components: { LastBlocks, LastTransfers, LastExtrinsics, LastEvents },
	props: ['blocks', 'transfers', 'extrinsics', 'events'],
}
</script>

<style lang="scss" scoped>

	section
	{
		display: flex;
		flex-direction: column;
		gap: 3.2em 6.4em;
		gap: 3.2em;

		> section
		{
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;

			> article
			{
				flex: 1 1 0;
			}
		}
	}

</style>


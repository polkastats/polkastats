
<template>
  <section class="section tables">
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
import LastBlocks from '@/components/home/LastBlocks.vue'
import LastTransfers from '@/components/home/LastTransfers.vue'
import LastExtrinsics from '@/components/home/LastExtrinsics.vue'
import LastEvents from '@/components/home/LastEvents.vue'

export default {
	components: { LastBlocks, LastTransfers, LastExtrinsics, LastEvents },
	props: ['blocks', 'transfers', 'extrinsics', 'events'],
}
</script>
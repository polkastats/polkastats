
<template>
  <section class="section tables row" color="i-fifth">
		<LastBlocks class="col-lg-6 col-sm-12" />
		<LastTransfers class="col-lg-6 col-sm-12" />
		<LastExtrinsics class="col-lg-6 col-sm-12" />
		<LastEvents class="col-lg-6 col-sm-12" />
		<WhaleAlert class="col-12" />
  </section>
</template>

<script>
import LastBlocks from '@/components/home/LastBlocks.vue'
import LastTransfers from '@/components/home/LastTransfers.vue'
import LastExtrinsics from '@/components/home/LastExtrinsics.vue'
import LastEvents from '@/components/home/LastEvents.vue'
import WhaleAlert from '@/components/home/WhaleAlert.vue'

export default {
	components: { LastBlocks, LastTransfers, LastExtrinsics, LastEvents, WhaleAlert }
}
</script>
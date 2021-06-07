<template>
  <div class="text-center py-4">
    <trinity-rings-spinner
      :animation-duration="1500"
      :size="66"
      :color="color"
      style="margin: 0 auto"
    />
    <p class="text-center">loading data ...</p>
  </div>
</template>
<script>
import { TrinityRingsSpinner } from 'epic-spinners'
export default {
  components: {
    TrinityRingsSpinner,
  },
  props: {
    color: {
      type: String,
      default: () => '#fff',
    },
  },
}
</script>

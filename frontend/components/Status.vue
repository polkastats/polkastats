<template>
	<spec-item v-if="unclass && status" variant="i-success">
		<span>
			<font-awesome-icon icon="check" />
			{{ $t('components.status.success') }}
		</span>
	</spec-item>
	<spec-item v-else-if="unclass && !status" variant="i-danger">
		<span>
			<font-awesome-icon icon="times" />
			{{ $t('components.status.error') }}
		</span>
		<p v-if="errorMessage">
			{{ errorMessage }}
		</p>
	</spec-item>
  <div v-else-if="status">
    <div class="status-label status-success text-success">
      <font-awesome-icon icon="check" class="text-success" />
      {{ $t('components.status.success') }}
    </div>
  </div>
  <div v-else>
    <div class="status-label status-error text-danger">
      <font-awesome-icon icon="times" class="text-danger" />
      {{ $t('components.status.error') }}
    </div>
    <p v-if="errorMessage" class="d-inline-block text-danger mb-0">
      {{ errorMessage }}
    </p>
  </div>
</template>
<script>
import SpecItem from '@/components/more/SpecItem.vue'

export default {
	components: { SpecItem },
  props: {
    status: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: '',
    },
    unclass: {
      type: Boolean,
    },
  },
}
</script>
<style>
.status-label {
  width: 90px;
  padding: 0.5rem;
  border-radius: 0.2rem;
  font-size: 0.8rem;
  display: inline-block;
  text-align: center;
}
.status-success {
  background-color: #bdeddd;
}
.status-error {
  background-color: #ecced0;
  margin-right: 2rem;
}
</style>

<template>
  <div v-if="status">
    <div class="status-label status-success text-success">
      <font-awesome-icon icon="check" class="text-success" />
      Success
    </div>
  </div>
  <div v-else>
    <div class="status-label status-error text-danger">
      <font-awesome-icon icon="times" class="text-danger" />
      Error
    </div>
    <p v-if="errorMessage" class="d-inline-block text-danger mb-0">
      {{ errorMessage }}
    </p>
  </div>
</template>
<script>
export default {
  props: {
    status: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: '',
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

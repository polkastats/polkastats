<template>
  <b-button-group size="sm" class="mt-5">
    <button
      v-for="(value, name, index) in buttons"
      :key="index"
      type="button"
      class="btn"
      :class="{ active: activeButton === value.name }"
      @click="value.method"
    >
      {{ value.name }}
    </button>
  </b-button-group>
</template>
<script>
export default {
  props: ['buttons', 'activeButton'],
}
</script>
<style scoped>
.btn {
  background: none;
  border: solid 1px black;
}

.active {
  border: none !important;
  background-color: #131b32 !important;
  color: white !important;
}
</style>

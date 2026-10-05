<script setup>
import { ref } from 'vue'

const emit = defineEmits(['buscar'])
const texto = ref('')

function buscar() {
  emit('buscar', texto.value)
}
</script>

<template>
  <div class="search-bar">
    <input
      v-model="texto"
      type="text"
      placeholder="Buscar productos..."
      @keyup.enter="buscar"
    />
    <button type="button" @click="buscar">Buscar</button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  max-width: 560px;
}
.search-bar input {
  flex: 1;
  padding: 8px 12px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.search-bar button {
  padding: 8px 16px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  background-color: #42b883;
  color: #fff;
  cursor: pointer;
}
</style>

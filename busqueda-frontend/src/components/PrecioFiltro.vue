<template>
  <div class="precio-filtro">
    <div class="inputs">
      <input type="number" v-model.number="minVal" placeholder="Mín" />
      <input type="number" v-model.number="maxVal" placeholder="Máx" />
    </div>
    <div v-if="invalido" class="aviso">min no puede ser mayor a max</div>
    <div class="acciones">
      <button @click="aplicar" :disabled="invalido">Aplicar</button>
      <button @click="limpiar">Limpiar</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['aplicar', 'limpiar'])

const minVal = ref(null)
const maxVal = ref(null)

const invalido = computed(() => {
  if (minVal.value !== null && minVal.value !== '' && maxVal.value !== null && maxVal.value !== '') {
    const min = Number(minVal.value)
    const max = Number(maxVal.value)
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      return min > max
    }
  }
  return false
})

function aplicar() {
  emit('aplicar', {
    minPrice: minVal.value === '' ? null : minVal.value,
    maxPrice: maxVal.value === '' ? null : maxVal.value
  })
}

function limpiar() {
  minVal.value = null
  maxVal.value = null
  emit('limpiar')
}
</script>

<style scoped>
.precio-filtro {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.precio-filtro .inputs {
  display: flex;
  gap: 8px;
}

.precio-filtro input {
  width: 100%;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
  box-sizing: border-box;
}

.precio-filtro input:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
}

.precio-filtro .aviso {
  color: #b91c1c;
  font-size: 13px;
}

.precio-filtro .acciones {
  display: flex;
  gap: 8px;
}

.precio-filtro button {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.precio-filtro button:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #0f766e;
}

.precio-filtro button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
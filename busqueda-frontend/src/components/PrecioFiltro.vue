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

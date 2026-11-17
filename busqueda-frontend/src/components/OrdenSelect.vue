<template>
  <div class="orden-select">
    <label>Ordenar por:</label>
    <select :value="modelo" @change="onChange">
      <option value="relevancia:asc">Relevancia</option>
      <option value="precio:asc">Precio: menor a mayor</option>
      <option value="precio:desc">Precio: mayor a menor</option>
      <option value="nombre:asc">Nombre: A-Z</option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  orden: { type: String, default: 'relevancia' },
  direccion: { type: String, default: 'asc' }
})

const emit = defineEmits(['cambiar'])

const modelo = computed(() => `${props.orden}:${props.direccion}`)

function onChange(e) {
  const [orden, direccion] = e.target.value.split(':')
  if (orden === 'relevancia') {
    emit('cambiar', { orden: 'relevancia', direccion: 'asc' })
  } else {
    emit('cambiar', { orden, direccion })
  }
}
</script>

<style scoped>
.orden-select {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.orden-select label {
  color: #6b7280;
  font-size: 14px;
}

.orden-select select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #111827;
}

.orden-select select:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
}
</style>
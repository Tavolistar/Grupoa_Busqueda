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

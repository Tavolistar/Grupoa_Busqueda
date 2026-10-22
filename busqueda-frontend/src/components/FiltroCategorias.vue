<template>
  <div class="filtro-categorias">
    <h3>Categorías</h3>
    <div v-for="f in opciones" :key="f.id" class="categoria-item">
      <label>
        <input
          type="checkbox"
          :value="f.id"
          :checked="seleccionadas.includes(f.id)"
          @change="toggle(f.id)"
        />
        {{ f.nombre }} ({{ f.total }})
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  facetas: { type: Array, default: () => [] },
  seleccionadas: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:seleccionadas'])

// Acepta { id, nombre, total } (contrato v1.1), buckets crudos de Elasticsearch
// { key, doc_count } o un simple texto
const opciones = computed(() =>
  props.facetas.map((f) => {
    const id = typeof f === 'string' ? f : (f.id ?? f.key)
    return {
      id,
      nombre: f.nombre ?? String(id).replace(/^cat-/, ''),
      total: f.total ?? f.doc_count ?? 0
    }
  })
)

function toggle(id) {
  const arr = [...props.seleccionadas]
  const idx = arr.indexOf(id)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(id)
  emit('update:seleccionadas', arr)
}
</script>

<template>
  <div class="filtro-categorias">
    <h3>Categorías</h3>
    <div v-for="f in facetas" :key="f.key || f.nombre" class="categoria-item">
      <label>
        <input
          type="checkbox"
          :value="f.key || f.nombre"
          :checked="seleccionadas.includes(f.key || f.nombre)"
          @change="toggle(f.key || f.nombre)"
        />
        {{ f.key || f.nombre }} ({{ f.doc_count ?? f.total ?? 0 }})
      </label>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  facetas: {
    type: Array,
    default: () => []
  },
  seleccionadas: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:seleccionadas'])

function toggle(cat) {
  const arr = [...props.seleccionadas]
  const idx = arr.indexOf(cat)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(cat)
  }
  emit('update:seleccionadas', arr)
}
</script>

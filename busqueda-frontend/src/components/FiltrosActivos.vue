<template>
  <div class="filtros-activos">
    <span v-for="c in categorias" :key="c" class="chip">
      {{ c }} <button @click="$emit('quitar-categoria', c)">x</button>
    </span>
    <span v-if="precioActivo" class="chip">
      {{ textoPrecio }} <button @click="$emit('quitar-precio')">x</button>
    </span>
    <button v-if="hayFiltros" @click="$emit('limpiar-todo')">Limpiar todo</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  categorias: { type: Array, default: () => [] },
  minPrice: { type: [Number, String, null], default: null },
  maxPrice: { type: [Number, String, null], default: null }
})

defineEmits(['quitar-categoria', 'quitar-precio', 'limpiar-todo'])

const precioActivo = computed(() => props.minPrice !== null && props.minPrice !== '' || props.maxPrice !== null && props.maxPrice !== '')

const textoPrecio = computed(() => {
  if (props.minPrice && props.maxPrice) return `$${props.minPrice} - $${props.maxPrice}`
  if (props.minPrice) return `>= $${props.minPrice}`
  if (props.maxPrice) return `<= $${props.maxPrice}`
  return ''
})

const hayFiltros = computed(() => (props.categorias && props.categorias.length > 0) || precioActivo.value)
</script>

<style scoped>
.filtros-activos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}

.filtros-activos:empty {
  display: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #111827;
  border-radius: 999px;
  padding: 4px 8px 4px 12px;
  font-size: 14px;
}

.chip button {
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 4px;
  border-radius: 999px;
}

.chip button:hover {
  color: #b91c1c;
}

.filtros-activos > button {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #0f766e;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
}

.filtros-activos > button:hover {
  background: #f8fafc;
  border-color: #0f766e;
}
</style>
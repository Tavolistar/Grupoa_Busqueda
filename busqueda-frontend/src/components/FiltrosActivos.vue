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

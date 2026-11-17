<template>
  <nav v-if="totalPaginas > 1" class="paginacion" aria-label="Paginación de resultados">
    <p class="rango">Mostrando {{ desde }}–{{ hasta }} de {{ total }} productos</p>
    <div class="controles">
      <button type="button" :disabled="!hayAnterior" @click="ir(pagina - 1)">Anterior</button>
      <template v-for="item in paginas" :key="item.clave">
        <span v-if="item.tipo === 'salto'" class="salto">…</span>
        <button
          v-else
          type="button"
          :class="{ actual: item.numero === pagina }"
          :aria-current="item.numero === pagina ? 'page' : undefined"
          @click="ir(item.numero)"
        >
          {{ item.numero }}
        </button>
      </template>
      <button type="button" :disabled="!haySiguiente" @click="ir(pagina + 1)">Siguiente</button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  pagina: { type: Number, required: true },
  totalPaginas: { type: Number, default: 0 },
  tamanoPagina: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
  hayAnterior: { type: Boolean, default: false },
  haySiguiente: { type: Boolean, default: false }
})

const emit = defineEmits(['cambiar'])

const desde = computed(() => (props.pagina - 1) * props.tamanoPagina + 1)
const hasta = computed(() => Math.min(props.pagina * props.tamanoPagina, props.total))

// Primera, última y dos páginas a cada lado de la actual; el resto se resume con "…"
const paginas = computed(() => {
  const numeros = new Set([1, props.totalPaginas])
  for (let n = props.pagina - 2; n <= props.pagina + 2; n++) {
    if (n >= 1 && n <= props.totalPaginas) numeros.add(n)
  }
  const ordenados = [...numeros].sort((a, b) => a - b)
  const items = []
  ordenados.forEach((n, i) => {
    if (i > 0 && n - ordenados[i - 1] > 1) items.push({ tipo: 'salto', clave: `salto-${n}` })
    items.push({ tipo: 'pagina', numero: n, clave: `p-${n}` })
  })
  return items
})

function ir(n) {
  if (n >= 1 && n <= props.totalPaginas && n !== props.pagina) emit('cambiar', n)
}
</script>

<style scoped>
.paginacion {
  margin: 16px 0;
  color: #6b7280;
}

.rango {
  margin: 0 0 8px;
  font-size: 14px;
}

.controles {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.controles button {
  min-width: 36px;
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}

.controles button:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #0f766e;
}

.controles button.actual {
  background: #0f766e;
  color: #ffffff;
  border-color: #0f766e;
  font-weight: 600;
}

.controles button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.salto {
  padding: 0 4px;
}
</style>
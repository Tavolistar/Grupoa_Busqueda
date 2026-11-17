<script setup>
import { ref } from 'vue'
import { API } from '../api'

const emit = defineEmits(['buscar'])
const texto = ref('')
const sugerencias = ref([])
const mostrando = ref(false)
let temporizador = null
// Cambia en cada búsqueda: una respuesta de sugerencias que llega después de buscar se descarta,
// para que la lista no se abra encima de los resultados
let generacion = 0

function buscar() {
  clearTimeout(temporizador)
  generacion++
  emit('buscar', texto.value)
  mostrando.value = false
}

// Varios productos pueden sugerir el mismo texto (por ejemplo, "Gorra"): se muestra una sola vez
function sinRepetidos(lista) {
  const vistos = new Set()
  return lista.filter((s) => {
    const clave = `${s.tipo}:${String(s.texto).toLowerCase()}`
    if (vistos.has(clave)) return false
    vistos.add(clave)
    return true
  })
}

function alEscribir() {
  clearTimeout(temporizador)
  const q = texto.value.trim()
  if (q.length < 2) {
    sugerencias.value = []
    mostrando.value = false
    return
  }
  const pedido = generacion
  temporizador = setTimeout(async () => {
    try {
      const respuesta = await fetch(
        `${API}/sugerencias?q=${encodeURIComponent(q)}`
      )
      if (!respuesta.ok || pedido !== generacion) return
      const datos = await respuesta.json()
      if (pedido !== generacion) return
      sugerencias.value = sinRepetidos(datos.sugerencias || [])
      mostrando.value = sugerencias.value.length > 0
    } catch {
      sugerencias.value = []
      mostrando.value = false
    }
  }, 300)
}

function elegir(sugerencia) {
  texto.value = sugerencia.texto
  buscar()
}

function ocultar() {
  setTimeout(() => {
    mostrando.value = false
  }, 150)
}
</script>

<template>
  <div class="search-bar">
    <div class="input-wrap">
      <input
        v-model="texto"
        type="text"
        placeholder="Buscar productos..."
        @input="alEscribir"
        @keyup.enter="buscar"
        @keydown.esc="mostrando = false"
        @focus="mostrando = sugerencias.length > 0"
        @blur="ocultar"
      />
      <ul v-if="mostrando && sugerencias.length" class="sugerencias">
        <li
          v-for="s in sugerencias"
          :key="s.tipo + s.texto"
          @mousedown.prevent="elegir(s)"
        >
          <span class="texto">{{ s.texto }}</span>
          <span class="tipo" :class="s.tipo">{{ s.tipo }}</span>
        </li>
      </ul>
    </div>
    <button type="button" @click="buscar">Buscar</button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  max-width: 560px;
}
.input-wrap {
  position: relative;
  flex: 1;
}
.search-bar input {
  width: 100%;
  padding: 8px 12px;
  font-size: 16px;
  border: 1px solid var(--borde);
  border-radius: var(--radio-chico);
  box-sizing: border-box;
}
.sugerencias {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  background: var(--superficie);
  border: 1px solid var(--borde);
  border-radius: var(--radio-chico);
  box-shadow: var(--sombra);
  z-index: 10;
  max-height: 240px;
  overflow-y: auto;
}
.sugerencias li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
}
.sugerencias li:hover {
  background: var(--fondo-suave);
}
.tipo {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  color: #fff;
  text-transform: capitalize;
  flex-shrink: 0;
}
.tipo.producto {
  background-color: var(--acento);
}
.tipo.categoria {
  background-color: var(--aviso);
}
.search-bar button {
  padding: 8px 16px;
  font-size: 16px;
  border: 1px solid var(--acento);
  border-radius: var(--radio-chico);
  background-color: var(--acento);
  color: #fff;
  cursor: pointer;
}
.search-bar button:hover {
  color: #fff;
  opacity: 0.9;
}
</style>

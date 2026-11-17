<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { API_BASE } from '../composables/useBusqueda'

const emit = defineEmits(['buscar'])
const texto = ref('')
const sugerencias = ref([])
const mostrando = ref(false)
const raiz = ref(null)

// Debounce de sugerencias (autocompletado) y de búsqueda en tiempo real
const TEMPORIZADOR_SUGERENCIAS = 300
const TEMPORIZADOR_BUSQUEDA = 350
let temporizadorSugerencias = null
let temporizadorBusqueda = null
let controladorSugerencias = null

function buscar() {
  clearTimeout(temporizadorSugerencias)
  clearTimeout(temporizadorBusqueda)
  mostrando.value = false
  sugerencias.value = []
  emit('buscar', texto.value.trim())
}

function alEscribir() {
  clearTimeout(temporizadorSugerencias)
  clearTimeout(temporizadorBusqueda)

  const q = texto.value.trim()

  // Búsqueda en tiempo real: si se vacía el texto, restaurar todos los productos ya.
  if (q === '') {
    emit('buscar', '')
  } else {
    temporizadorBusqueda = setTimeout(() => {
      emit('buscar', texto.value.trim())
    }, TEMPORIZADOR_BUSQUEDA)
  }

  // Autocompletado de sugerencias (mínimo 2 caracteres)
  if (q.length < 2) {
    sugerencias.value = []
    mostrando.value = false
    return
  }

  temporizadorSugerencias = setTimeout(async () => {
    if (controladorSugerencias) controladorSugerencias.abort()
    const ctrl = new AbortController()
    controladorSugerencias = ctrl
    try {
      const respuesta = await fetch(
        `${API_BASE}/sugerencias?q=${encodeURIComponent(q)}`,
        { signal: ctrl.signal }
      )
      if (!respuesta.ok) return
      const datos = await respuesta.json()
      if (ctrl.signal.aborted) return
      sugerencias.value = datos.sugerencias || []
      mostrando.value = sugerencias.value.length > 0
    } catch {
      sugerencias.value = []
      mostrando.value = false
    }
  }, TEMPORIZADOR_SUGERENCIAS)
}

function elegir(sugerencia) {
  clearTimeout(temporizadorSugerencias)
  clearTimeout(temporizadorBusqueda)
  texto.value = sugerencia.texto
  sugerencias.value = []
  mostrando.value = false
  emit('buscar', texto.value.trim())
}

function cerrar() {
  mostrando.value = false
}

// Cierra el dropdown al hacer clic fuera del componente
function alClicFuera(e) {
  if (raiz.value && !raiz.value.contains(e.target)) mostrando.value = false
}

// Cierra el dropdown cuando el foco abandona el componente (navegación con teclado)
function alPerderFoco(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) mostrando.value = false
}

onMounted(() => document.addEventListener('click', alClicFuera))
onBeforeUnmount(() => {
  document.removeEventListener('click', alClicFuera)
  clearTimeout(temporizadorSugerencias)
  clearTimeout(temporizadorBusqueda)
  if (controladorSugerencias) controladorSugerencias.abort()
})
</script>

<template>
  <div ref="raiz" class="search-bar" @focusout="alPerderFoco">
    <div class="input-wrap">
      <input
        v-model="texto"
        type="text"
        placeholder="Buscar productos..."
        @input="alEscribir"
        @keyup.enter="buscar"
        @keydown.esc="cerrar"
        @focus="mostrando = sugerencias.length > 0"
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
  max-width: 640px;
  margin: 0 auto;
}
.input-wrap {
  position: relative;
  flex: 1;
}
.search-bar input {
  width: 100%;
  padding: 10px 14px;
  font-size: 16px;
  color: #111827;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.search-bar input::placeholder {
  color: #9ca3af;
}
.search-bar input:focus {
  outline: none;
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.15);
}
.sugerencias {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.12);
  z-index: 10;
  max-height: 240px;
  overflow-y: auto;
}
.sugerencias li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  cursor: pointer;
  color: #111827;
}
.sugerencias li:hover {
  background: #f8fafc;
}
.tipo {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  color: #ffffff;
  text-transform: capitalize;
  flex-shrink: 0;
}
.tipo.producto {
  background-color: #0f766e;
}
.tipo.categoria {
  background-color: #16a34a;
}
.search-bar button {
  padding: 10px 18px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  background-color: #0f766e;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.15s;
}
.search-bar button:hover {
  background-color: #115e59;
}
</style>
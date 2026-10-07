<script setup>
import { ref } from 'vue'

const emit = defineEmits(['buscar'])
const texto = ref('')
const sugerencias = ref([])
const mostrando = ref(false)
let temporizador = null

function buscar() {
  emit('buscar', texto.value)
  mostrando.value = false
}

function alEscribir() {
  clearTimeout(temporizador)
  const q = texto.value.trim()
  if (q.length < 2) {
    sugerencias.value = []
    mostrando.value = false
    return
  }
  temporizador = setTimeout(async () => {
    try {
      const respuesta = await fetch(
        `http://localhost:3000/api/busqueda/sugerencias?q=${encodeURIComponent(q)}`
      )
      if (!respuesta.ok) return
      const datos = await respuesta.json()
      sugerencias.value = datos.sugerencias || []
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
  border: 1px solid #ccc;
  border-radius: 6px;
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
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  background: #f0f0f0;
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
  background-color: #42b883;
}
.tipo.categoria {
  background-color: #f59e0b;
}
.search-bar button {
  padding: 8px 16px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  background-color: #42b883;
  color: #fff;
  cursor: pointer;
}
</style>

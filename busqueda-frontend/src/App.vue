<script setup>
import { ref } from 'vue'
import SearchBar from './components/SearchBar.vue'

const productos = ref([])
const total = ref(0)
const cargando = ref(false)
const error = ref(null)
const busqueda = ref('')
const sugerenciaTermino = ref(null)
const categoriasPopulares = ref([])

async function buscar(q) {
  busqueda.value = q
  error.value = null
  sugerenciaTermino.value = null
  categoriasPopulares.value = []
  productos.value = []
  total.value = 0
  cargando.value = true

  try {
    const respuesta = await fetch(
      `http://localhost:3000/api/busqueda/productos?q=${encodeURIComponent(q)}`
    )
    if (!respuesta.ok) {
      throw new Error('Error en la respuesta del servidor')
    }
    const datos = await respuesta.json()
    productos.value = datos.productos
    total.value = datos.total
    sugerenciaTermino.value = datos.sugerenciaTermino
    categoriasPopulares.value = datos.categoriasPopulares
  } catch (err) {
    error.value = 'No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo.'
  } finally {
    cargando.value = false
  }
}

function etiquetaCategoria(c) {
  if (typeof c === 'string') return c
  if (c && typeof c === 'object') return c.nombre || c.categoria || c.name || String(c)
  return String(c)
}

function buscarSugerencia() {
  if (sugerenciaTermino.value) {
    buscar(sugerenciaTermino.value)
  }
}
</script>

<template>
  <main>
    <h1>Búsqueda de productos</h1>
    <SearchBar @buscar="buscar" />

    <p v-if="cargando">Cargando...</p>

    <p v-else-if="error">{{ error }}</p>

    <template v-else-if="total > 0">
      <ul>
        <li v-for="producto in productos" :key="producto.id">
          <strong>{{ producto.nombre }}</strong> — ${{ producto.precio }}
        </li>
      </ul>
    </template>

    <template v-else-if="total === 0 && busqueda">
      <p>No encontramos productos para '{{ busqueda }}'</p>

      <button v-if="sugerenciaTermino" type="button" @click="buscarSugerencia">
        ¿Quisiste decir "{{ sugerenciaTermino }}"?
      </button>

      <div v-if="categoriasPopulares.length > 0">
        <p>Categorías populares:</p>
        <ul>
          <li v-for="categoria in categoriasPopulares" :key="etiquetaCategoria(categoria)">
            <a href="#" @click.prevent="buscar(etiquetaCategoria(categoria))">
              {{ etiquetaCategoria(categoria) }}
            </a>
          </li>
        </ul>
      </div>
    </template>
  </main>
</template>

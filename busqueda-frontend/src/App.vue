<script setup>
import { ref, onMounted } from 'vue'
import SearchBar from './components/SearchBar.vue'
import FiltroCategorias from './components/FiltroCategorias.vue'
import OrdenSelect from './components/OrdenSelect.vue'
import PrecioFiltro from './components/PrecioFiltro.vue'
import FiltrosActivos from './components/FiltrosActivos.vue'
import { useBusqueda } from './composables/useBusqueda'

const { filtros, resultado, cargando, error, buscar } = useBusqueda()

const facetasCategorias = ref([])

onMounted(() => {
  facetasCategorias.value = resultado.value.facetas?.categorias || []
})

async function onBuscar(q) {
  filtros.q = q
  await buscar()
  facetasCategorias.value = resultado.value.facetas?.categorias || []
}

async function onCategoriasUpdate(seleccionadas) {
  filtros.categorias = seleccionadas
  await buscar()
  facetasCategorias.value = resultado.value.facetas?.categorias || []
}

async function onOrdenCambiar(val) {
  filtros.orden = val.orden
  filtros.direccion = val.direccion
  await buscar()
}

async function onPrecioAplicar(val) {
  filtros.minPrice = val.minPrice
  filtros.maxPrice = val.maxPrice
  await buscar()
}

async function onPrecioLimpiar() {
  filtros.minPrice = null
  filtros.maxPrice = null
  await buscar()
}

async function quitarCategoria(c) {
  filtros.categorias = filtros.categorias.filter((x) => x !== c)
  await buscar()
  facetasCategorias.value = resultado.value.facetas?.categorias || []
}

async function quitarPrecio() {
  filtros.minPrice = null
  filtros.maxPrice = null
  await buscar()
}

async function limpiarTodo() {
  filtros.categorias = []
  filtros.minPrice = null
  filtros.maxPrice = null
  filtros.orden = 'relevancia'
  filtros.direccion = 'asc'
  await buscar()
}
</script>

<template>
  <main>
    <h1>Búsqueda de productos</h1>
    <SearchBar @buscar="onBuscar" />

    <div class="layout">
      <aside>
        <FiltroCategorias :facetas="facetasCategorias.length ? facetasCategorias : resultado.facetas.categorias" :seleccionadas="filtros.categorias" @update:seleccionadas="onCategoriasUpdate" />
        <PrecioFiltro @aplicar="onPrecioAplicar" @limpiar="onPrecioLimpiar" />
      </aside>

      <section>
        <div class="toolbar">
          <FiltrosActivos :categorias="filtros.categorias" :minPrice="filtros.minPrice" :maxPrice="filtros.maxPrice" @quitar-categoria="quitarCategoria" @quitar-precio="quitarPrecio" @limpiar-todo="limpiarTodo" />
          <OrdenSelect :orden="filtros.orden" :direccion="filtros.direccion" @cambiar="onOrdenCambiar" />
        </div>

        <p v-if="cargando">Cargando...</p>
        <p v-else-if="error">{{ error }}</p>
        <template v-else-if="resultado.total > 0">
          <p>Total: {{ resultado.total }}</p>
          <ul>
            <li v-for="producto in resultado.productos" :key="producto.id">
              <strong>{{ producto.nombre }}</strong> — ${{ producto.precio }}
            </li>
          </ul>
        </template>
        <template v-else-if="resultado.total === 0 && filtros.q">
          <p>No encontramos productos para '{{ filtros.q }}'</p>
        </template>
      </section>
    </div>
  </main>
</template>

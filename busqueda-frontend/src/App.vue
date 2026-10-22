<script setup>
import { ref } from 'vue'
import SearchBar from './components/SearchBar.vue'
import FiltroCategorias from './components/FiltroCategorias.vue'
import OrdenSelect from './components/OrdenSelect.vue'
import PrecioFiltro from './components/PrecioFiltro.vue'
import FiltrosActivos from './components/FiltrosActivos.vue'
import { useBusqueda } from './composables/useBusqueda'

const { filtros, resultado, cargando, error, buscar, limpiarFiltros } = useBusqueda()
const consultaRealizada = ref(false)

function onBuscar(q) {
  filtros.q = q
  consultaRealizada.value = true
  buscar()
}

function onFiltrosCambian() {
  consultaRealizada.value = true
  buscar()
}

function onCategorias(nuevas) {
  filtros.categorias = nuevas
  onFiltrosCambian()
}

function onOrden({ orden, direccion }) {
  filtros.orden = orden
  filtros.direccion = direccion
  onFiltrosCambian()
}

function onPrecio({ minPrice, maxPrice }) {
  filtros.minPrice = minPrice
  filtros.maxPrice = maxPrice
  onFiltrosCambian()
}

function onQuitarCategoria(c) {
  filtros.categorias = filtros.categorias.filter((x) => x !== c)
  onFiltrosCambian()
}

function onQuitarPrecio() {
  filtros.minPrice = null
  filtros.maxPrice = null
  onFiltrosCambian()
}

function onLimpiarTodo() {
  limpiarFiltros()
  onFiltrosCambian()
}

function buscarSugerencia() {
  if (resultado.value.sugerenciaTermino) onBuscar(resultado.value.sugerenciaTermino)
}

function etiquetaCategoria(c) {
  if (typeof c === 'string') return c
  if (c && typeof c === 'object') return c.nombre || c.categoria || c.name || String(c)
  return String(c)
}
</script>

<template>
  <main>
    <h1>Búsqueda de productos</h1>
    <SearchBar @buscar="onBuscar" />

    <FiltrosActivos
      :categorias="filtros.categorias"
      :min-price="filtros.minPrice"
      :max-price="filtros.maxPrice"
      @quitar-categoria="onQuitarCategoria"
      @quitar-precio="onQuitarPrecio"
      @limpiar-todo="onLimpiarTodo"
    />

    <section class="filtros">
      <FiltroCategorias
        :facetas="resultado.facetas.categorias"
        :seleccionadas="filtros.categorias"
        @update:seleccionadas="onCategorias"
      />
      <PrecioFiltro @aplicar="onPrecio" @limpiar="onQuitarPrecio" />
      <OrdenSelect :orden="filtros.orden" :direccion="filtros.direccion" @cambiar="onOrden" />
    </section>

    <p v-if="cargando">Cargando...</p>
    <p v-else-if="error">{{ error }}</p>
    <template v-else-if="resultado.total > 0">
      <ul>
        <li v-for="producto in resultado.productos" :key="producto.id">
          <strong>{{ producto.nombre }}</strong> — ${{ producto.precio }}
        </li>
      </ul>
    </template>
    <template v-else-if="consultaRealizada">
      <p>No encontramos productos<template v-if="filtros.q"> para '{{ filtros.q }}'</template></p>
      <p v-if="filtros.categorias.length || filtros.minPrice !== null || filtros.maxPrice !== null">
        Prueba quitando algún filtro.
      </p>
      <button v-if="resultado.sugerenciaTermino" type="button" @click="buscarSugerencia">
        ¿Quisiste decir "{{ resultado.sugerenciaTermino }}"?
      </button>
      <div v-if="resultado.categoriasPopulares.length > 0">
        <p>Categorías populares:</p>
        <ul>
          <li v-for="categoria in resultado.categoriasPopulares" :key="etiquetaCategoria(categoria)">
            <a href="#" @click.prevent="onBuscar(etiquetaCategoria(categoria))">
              {{ etiquetaCategoria(categoria) }}
            </a>
          </li>
        </ul>
      </div>
    </template>
  </main>
</template>

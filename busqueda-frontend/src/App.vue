<script setup>
import { ref, computed } from 'vue'
import SearchBar from './components/SearchBar.vue'
import FiltroCategorias from './components/FiltroCategorias.vue'
import OrdenSelect from './components/OrdenSelect.vue'
import PrecioFiltro from './components/PrecioFiltro.vue'
import FiltrosActivos from './components/FiltrosActivos.vue'
import Paginacion from './components/Paginacion.vue'
import DrawerFiltros from './components/DrawerFiltros.vue'
import { useBusqueda } from './composables/useBusqueda'

const { filtros, resultado, cargando, error, buscar, limpiarFiltros } = useBusqueda()
const consultaRealizada = ref(false)

const formatoPrecio = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// Se muestra en el botón "Filtros (n)" de la vista móvil
const cantidadFiltros = computed(() => {
  const precio = (filtros.minPrice !== null && filtros.minPrice !== '') || (filtros.maxPrice !== null && filtros.maxPrice !== '')
  return filtros.categorias.length + (precio ? 1 : 0)
})

function onBuscar(q) {
  filtros.q = q
  filtros.pagina = 1
  consultaRealizada.value = true
  buscar()
}

// Cualquier cambio de filtro u orden vuelve a la página 1
function onFiltrosCambian() {
  filtros.pagina = 1
  consultaRealizada.value = true
  buscar()
}

function onPagina(p) {
  filtros.pagina = p
  buscar()
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
  <main class="busqueda">
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

    <div class="contenido">
      <DrawerFiltros :cantidad="cantidadFiltros" :total="resultado.total">
        <FiltroCategorias
          :facetas="resultado.facetas.categorias"
          :seleccionadas="filtros.categorias"
          @update:seleccionadas="onCategorias"
        />
        <PrecioFiltro @aplicar="onPrecio" @limpiar="onQuitarPrecio" />
      </DrawerFiltros>

      <section class="resultados">
        <OrdenSelect :orden="filtros.orden" :direccion="filtros.direccion" @cambiar="onOrden" />

        <p v-if="cargando">Cargando...</p>
        <p v-else-if="error">{{ error }}</p>
        <template v-else-if="resultado.total > 0">
          <ul class="productos">
            <li v-for="producto in resultado.productos" :key="producto.id" class="tarjeta">
              <strong class="nombre">{{ producto.nombre }}</strong>
              <span class="precio">{{ formatoPrecio.format(producto.precio) }}</span>
              <span v-if="producto.categoria" class="categoria">{{ String(producto.categoria).replace(/^cat-/, '') }}</span>
            </li>
          </ul>
          <Paginacion
            :pagina="filtros.pagina"
            :total-paginas="resultado.totalPaginas"
            :tamano-pagina="filtros.tamanoPagina"
            :total="resultado.total"
            :hay-anterior="resultado.hayAnterior"
            :hay-siguiente="resultado.haySiguiente"
            @cambiar="onPagina"
          />
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
      </section>
    </div>
  </main>
</template>

<style>
/* HU-SRCH-12: vista móvil. Sin scoped porque ajusta también a los componentes hijos */
.busqueda {
  padding: 0 16px 32px;
  text-align: left;
}

.busqueda h1 {
  text-align: center;
}

main.busqueda .search-bar {
  max-width: 640px;
  margin: 0 auto 12px;
}

.contenido {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
  align-items: start;
}

.productos {
  list-style: none;
  padding: 0;
  margin: 12px 0;
  display: grid;
  gap: 12px;
  /* 1 columna en celular y hasta 4 en escritorio, según el espacio disponible */
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 190px), 1fr));
}

.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--code-bg);
}

.tarjeta .nombre {
  color: var(--text-h);
}

.tarjeta .categoria {
  font-size: 14px;
  text-transform: capitalize;
}

/* Tamaño táctil mínimo de 44 px */
.busqueda button,
.busqueda select,
.busqueda input:not([type='checkbox']) {
  min-height: 44px;
  font-size: 16px;
}

.busqueda .categoria-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
}

.busqueda input[type='checkbox'] {
  width: 20px;
  height: 20px;
}

.busqueda .precio-filtro .inputs {
  display: flex;
  gap: 8px;
}

.busqueda .precio-filtro input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@media (max-width: 767px) {
  .contenido {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>

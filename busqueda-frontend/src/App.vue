<script setup>
import { ref, computed, onMounted } from 'vue'
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

// Detecta si la app corre embebida en un iframe del Host App
const embebido = window.self !== window.top

// Ids de productos cuya imagen falló al cargar (muestra placeholder)
const imagenesFallidas = ref(new Set())

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

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

// Limpia el prefijo "cat-" y pone la primera letra en mayúscula
function categoriaLimpia(c) {
  const texto = String(c).replace(/^cat-/, '')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function imagenDe(producto) {
  const lista = producto.imagenes
  if (Array.isArray(lista) && lista.length > 0 && !imagenesFallidas.value.has(producto.id)) {
    return lista[0]
  }
  return null
}

function onImgError(id) {
  const copia = new Set(imagenesFallidas.value)
  copia.add(id)
  imagenesFallidas.value = copia
}

// Navegación al catálogo del Host App (funciona dentro o fuera del iframe)
function navegar(producto) {
  window.parent.postMessage({ tipo: 'navegar', ruta: `/catalogo/${producto.id}` }, '*')
}

function onTarjetaKeydown(e, producto) {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault()
    navegar(producto)
  }
}

// Carga inicial: muestra productos y puebla categorías al montar
onMounted(() => {
  consultaRealizada.value = true
  buscar()
})
</script>

<template>
  <main class="busqueda">
    <h1 v-if="!embebido">Búsqueda de productos</h1>
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
            <li
              v-for="producto in resultado.productos"
              :key="producto.id"
              class="tarjeta"
              role="button"
              tabindex="0"
              :aria-label="`Ver ${producto.nombre} en el catálogo`"
              @click="navegar(producto)"
              @keydown="onTarjetaKeydown($event, producto)"
            >
              <div class="tarjeta-img-wrap">
                <img
                  v-if="imagenDe(producto)"
                  :src="imagenDe(producto)"
                  :alt="producto.nombre"
                  loading="lazy"
                  @error="onImgError(producto.id)"
                />
                <span v-else class="tarjeta-placeholder" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </span>
              </div>
              <strong class="nombre">{{ producto.nombre }}</strong>
              <span class="precio">{{ formatoPrecio.format(producto.precio) }}</span>
              <span v-if="producto.categoria" class="categoria">{{ categoriaLimpia(producto.categoria) }}</span>
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
          <button v-if="resultado.sugerenciaTermino" type="button" class="sugerencia-btn" @click="buscarSugerencia">
            ¿Quisiste decir "{{ resultado.sugerenciaTermino }}"?
          </button>
          <div v-if="resultado.categoriasPopulares.length > 0">
            <p>Categorías populares:</p>
            <ul class="populares">
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
  grid-template-columns: 230px 1fr;
  gap: 24px;
  align-items: start;
}

.productos {
  list-style: none;
  padding: 0;
  margin: 12px 0;
  display: grid;
  gap: 1rem;
  /* 1 columna en celular y hasta 4 en escritorio, según el espacio disponible */
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
}

.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}

.tarjeta:hover {
  border-color: #d1d5db;
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.08);
  transform: translateY(-2px);
}

.tarjeta:focus-visible {
  outline: 2px solid #0f766e;
  outline-offset: 2px;
}

/* Recuadro de imagen con relación de aspecto fija 4:3 */
.tarjeta-img-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.tarjeta-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.tarjeta-placeholder {
  color: #cbd5e1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tarjeta .nombre {
  color: #111827;
  font-weight: 600;
  line-height: 1.3;
}

.tarjeta .precio {
  color: #0f766e;
  font-weight: 600;
}

.tarjeta .categoria {
  color: #6b7280;
  font-size: 13px;
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
  accent-color: #0f766e;
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

.sugerencia-btn {
  margin-top: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #0f766e;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.populares {
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.populares a {
  color: #0f766e;
  text-decoration: none;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 4px 12px;
  background: #f8fafc;
}

.populares a:hover {
  border-color: #0f766e;
}

@media (max-width: 767px) {
  .contenido {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
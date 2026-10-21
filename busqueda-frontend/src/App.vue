<script setup>
import { ref } from 'vue'
import SearchBar from './components/SearchBar.vue'
import { useBusqueda } from './composables/useBusqueda'
// TODO(Marlon · HU-SRCH-06-FE y 09-FE):
// import FiltroCategorias from './components/FiltroCategorias.vue'
// import OrdenSelect from './components/OrdenSelect.vue'
// TODO(Jhoan · HU-SRCH-07-FE y 08-FE):
// import PrecioFiltro from './components/PrecioFiltro.vue'
// import FiltrosActivos from './components/FiltrosActivos.vue'

const { filtros, resultado, cargando, error, buscar, limpiarFiltros } = useBusqueda()
const consultaRealizada = ref(false)

// Lo llama la barra de búsqueda (HU-SRCH-01-FE)
function onBuscar(q) {
  filtros.q = q
  consultaRealizada.value = true
  buscar()
}

// Lo llaman los componentes de filtros/orden cuando cambian algo: @cambio="onFiltrosCambian"
function onFiltrosCambian() {
  consultaRealizada.value = true
  buscar()
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

    <!-- ESPACIOS RESERVADOS: cada quien trabaja solo dentro de su bloque -->
    <section class="filtros">
      <!-- Marlon: <FiltroCategorias v-model="filtros.categorias" :facetas="resultado.facetas.categorias" @cambio="onFiltrosCambian" /> -->
      <!-- Jhoan:  <PrecioFiltro v-model:min="filtros.minPrice" v-model:max="filtros.maxPrice" @cambio="onFiltrosCambian" /> -->
      <!-- Marlon: <OrdenSelect v-model:orden="filtros.orden" v-model:direccion="filtros.direccion" @cambio="onFiltrosCambian" /> -->
    </section>
    <section class="filtros-activos">
      <!-- Jhoan:  <FiltrosActivos :filtros="filtros" @cambio="onFiltrosCambian" @limpiar="onLimpiarTodo" /> -->
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

// busqueda-frontend/src/composables/useBusqueda.js  (Fase 0 · Juan Pablo)
// Estado compartido de búsqueda + filtros. Marlon y Jhoan solo LEEN/ESCRIBEN `filtros`
// y llaman a `buscar()`; no deben tocar este archivo (si falta algo, pídelo al SM).
import { ref, reactive } from "vue";

// URL base de la API centralizada: se usa en las búsquedas y en las sugerencias.
// El Host App puede inyectar VITE_API_URL en el build/entorno de integración.
export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/busqueda";

export function useBusqueda() {
  const filtros = reactive({
    q: "",
    categorias: [],      // Marlon · HU-SRCH-06-FE
    minPrice: null,      // Jhoan  · HU-SRCH-07-FE
    maxPrice: null,
    orden: "relevancia", // Marlon · HU-SRCH-09-FE
    direccion: "asc",
    pagina: 1,           // Marlon · HU-SRCH-10-FE
    tamanoPagina: 20,
  });

  const resultado = ref({
    productos: [],
    total: 0,
    totalPaginas: 0,
    hayAnterior: false,
    haySiguiente: false,
    facetas: { categorias: [] },
    sugerenciaTermino: null,
    categoriasPopulares: [],
  });
  const cargando = ref(false);
  const error = ref(null);

  // Controlador de la petición en curso: permite cancelar la anterior cuando llega
  // una consulta nueva, evitando que una respuesta lenta sobrescriba una más reciente.
  let controlador = null;

  function construirParams() {
    const p = new URLSearchParams();
    if (filtros.q) p.set("q", filtros.q);
    filtros.categorias.forEach((c) => p.append("categoria", c));
    if (filtros.minPrice !== null && filtros.minPrice !== "") p.set("minPrice", filtros.minPrice);
    if (filtros.maxPrice !== null && filtros.maxPrice !== "") p.set("maxPrice", filtros.maxPrice);
    p.set("orden", filtros.orden);
    p.set("direccion", filtros.direccion);
    p.set("pagina", filtros.pagina);
    p.set("tamanoPagina", filtros.tamanoPagina);
    return p;
  }

  async function buscar() {
    // Cancela la petición anterior (si sigue en curso) antes de lanzar la nueva.
    if (controlador) controlador.abort();
    const ctrl = new AbortController();
    controlador = ctrl;

    cargando.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/productos?${construirParams()}`, {
        signal: ctrl.signal,
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "Error en la búsqueda");
      if (ctrl.signal.aborted) return; // una consulta más reciente ya tomó el control
      resultado.value = { facetas: { categorias: [] }, ...datos };
    } catch (e) {
      // Un abort es una cancelación intencional, no un error de la búsqueda.
      if (e.name === "AbortError") return;
      error.value = e.message || "No se pudo conectar con el servidor.";
    } finally {
      // Solo la petición vigente apaga el estado de carga.
      if (controlador === ctrl) cargando.value = false;
    }
  }

  function limpiarFiltros() {
    filtros.categorias = [];
    filtros.minPrice = null;
    filtros.maxPrice = null;
  }

  return { filtros, resultado, cargando, error, buscar, limpiarFiltros };
}
// busqueda-frontend/src/composables/useBusqueda.js  (Fase 0 · Juan Pablo)
// Estado compartido de búsqueda + filtros. Marlon y Jhoan solo LEEN/ESCRIBEN `filtros`
// y llaman a `buscar()`; no deben tocar este archivo (si falta algo, pídelo al SM).
import { ref, reactive } from "vue";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api/busqueda";

export function useBusqueda() {
  const filtros = reactive({
    q: "",
    categorias: [],      // Marlon · HU-SRCH-06-FE
    minPrice: null,      // Jhoan  · HU-SRCH-07-FE
    maxPrice: null,
    orden: "relevancia", // Marlon · HU-SRCH-09-FE
    direccion: "asc",
  });

  const resultado = ref({
    productos: [],
    total: 0,
    facetas: { categorias: [] },
    sugerenciaTermino: null,
    categoriasPopulares: [],
  });
  const cargando = ref(false);
  const error = ref(null);

  function construirParams() {
    const p = new URLSearchParams();
    if (filtros.q) p.set("q", filtros.q);
    filtros.categorias.forEach((c) => p.append("categoria", c));
    if (filtros.minPrice !== null && filtros.minPrice !== "") p.set("minPrice", filtros.minPrice);
    if (filtros.maxPrice !== null && filtros.maxPrice !== "") p.set("maxPrice", filtros.maxPrice);
    p.set("orden", filtros.orden);
    p.set("direccion", filtros.direccion);
    return p;
  }

  async function buscar() {
    cargando.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API}/productos?${construirParams()}`);
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.error || "Error en la búsqueda");
      resultado.value = { facetas: { categorias: [] }, ...datos };
    } catch (e) {
      error.value = e.message || "No se pudo conectar con el servidor.";
    } finally {
      cargando.value = false;
    }
  }

  function limpiarFiltros() {
    filtros.categorias = [];
    filtros.minPrice = null;
    filtros.maxPrice = null;
  }

  return { filtros, resultado, cargando, error, buscar, limpiarFiltros };
}

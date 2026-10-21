import { reactive, ref } from 'vue'

export function useBusqueda() {
  const filtros = reactive({
    q: '',
    categorias: [],
    minPrice: null,
    maxPrice: null,
    orden: 'relevancia',
    direccion: 'asc'
  })

  const resultado = ref({
    productos: [],
    total: 0,
    facetas: { categorias: [] },
    sugerenciaTermino: null,
    categoriasPopulares: []
  })

  const cargando = ref(false)
  const error = ref(null)

  function construirParams() {
    const params = new URLSearchParams()
    if (filtros.q) params.append('q', filtros.q)
    if (Array.isArray(filtros.categorias)) {
      for (const c of filtros.categorias) {
        if (c) params.append('categoria', c)
      }
    }
    if (filtros.minPrice !== null && filtros.minPrice !== '' && filtros.minPrice !== undefined) {
      params.append('minPrice', filtros.minPrice)
    }
    if (filtros.maxPrice !== null && filtros.maxPrice !== '' && filtros.maxPrice !== undefined) {
      params.append('maxPrice', filtros.maxPrice)
    }
    if (filtros.orden) params.append('orden', filtros.orden)
    if (filtros.direccion) params.append('direccion', filtros.direccion)
    return params
  }

  async function buscar() {
    cargando.value = true
    error.value = null
    try {
      const params = construirParams()
      const res = await fetch(`/api/busqueda/productos?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        error.value = data.error || `Error ${res.status}`
        return
      }
      const data = await res.json()
      resultado.value = {
        productos: data.productos || [],
        total: data.total || 0,
        facetas: data.facetas || { categorias: [] },
        sugerenciaTermino: data.sugerenciaTermino || null,
        categoriasPopulares: data.categoriasPopulares || []
      }
    } catch (e) {
      error.value = e.message
    } finally {
      cargando.value = false
    }
  }

  return { filtros, resultado, cargando, error, buscar, construirParams }
}

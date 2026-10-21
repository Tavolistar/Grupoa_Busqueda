async function alternativasParaSinResultados(q, pagina = 1, tamanoPagina = 20) {
  // Base con resultados vacíos; se puede extender con sugerencias
  return {
    productos: [],
    total: 0,
    pagina,
    tamanoPagina,
    sugerenciaTermino: null,
    categoriasPopulares: [],
    facetas: { categorias: [] },
  };
}

module.exports = { alternativasParaSinResultados };

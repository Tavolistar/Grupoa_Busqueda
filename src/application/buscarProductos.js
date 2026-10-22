// src/application/buscarProductos.js
const esClient = require("../infrastructure/elasticsearch/client");
const { construirQuery } = require("./construirQuery");
const { construirOrden } = require("./orden");
const { alternativasParaSinResultados } = require("./manejarSinResultados");

function formatearFacetas(aggregations) {
  const buckets = aggregations?.categorias?.buckets ?? [];
  return { categorias: buckets.map((b) => ({ key: b.key, doc_count: b.doc_count })) };
}

function hayFiltrosActivos(params) {
  const categorias = [].concat(params.categorias ?? params.categoria ?? []);
  return (
    categorias.length > 0 ||
    (params.minPrice !== undefined && params.minPrice !== null) ||
    (params.maxPrice !== undefined && params.maxPrice !== null)
  );
}

async function buscarProductos(paramsOrQ, pagina = 1, tamanoPagina = 20) {
  // Compatibilidad hacia atrás: si recibe un string es solo el texto de búsqueda
  let params = {};
  if (typeof paramsOrQ === "string") {
    params = { q: paramsOrQ, pagina, tamanoPagina };
  } else if (typeof paramsOrQ === "object" && paramsOrQ !== null) {
    params = paramsOrQ;
  }

  const q = params.q || "";
  const pag = params.pagina || pagina;
  const tamPag = params.tamanoPagina || tamanoPagina;

  const { query, postFilter, aggs } = construirQuery(params);
  const sort = construirOrden({ orden: params.orden, direccion: params.direccion });

  const searchParams = { index: "productos", from: (pag - 1) * tamPag, size: tamPag, query, sort };
  if (postFilter) searchParams.post_filter = postFilter;
  if (aggs) searchParams.aggs = aggs;

  const { hits, aggregations } = await esClient.search(searchParams);
  const total = hits.total?.value ?? 0;
  const facetas = formatearFacetas(aggregations);

  // Decisión de la Fase 0: las alternativas (HU-SRCH-04) solo con texto y SIN filtros activos
  if (total === 0 && q && !hayFiltrosActivos(params)) {
    const alt = await alternativasParaSinResultados(q, pag, tamPag);
    return { ...alt, facetas };
  }

  return {
    productos: hits.hits.map((h) => ({ id: h._id, ...h._source })),
    total,
    pagina: pag,
    tamanoPagina: tamPag,
    sugerenciaTermino: null,
    categoriasPopulares: [],
    facetas,
  };
}

module.exports = { buscarProductos };

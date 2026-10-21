// src/application/buscarProductos.js  (Fase 0 · refactor de Juan Pablo)
const esClient = require("../infrastructure/elasticsearch/client");
const { construirQuery } = require("./construirQuery");
const { construirOrden } = require("./orden");
const { alternativasParaSinResultados } = require("./manejarSinResultados");

function formatearFacetas(aggregations) {
  const buckets = aggregations?.categorias?.buckets ?? [];
  return {
    categorias: buckets.map((b) => ({
      id: b.key,
      nombre: String(b.key).replace(/^cat-/, ""),
      total: b.doc_count,
    })),
  };
}

function hayFiltros({ categorias, minPrice, maxPrice }) {
  return categorias.length > 0 || minPrice !== undefined || maxPrice !== undefined;
}

async function buscarProductos(params) {
  const { q, pagina, tamanoPagina } = params;
  const { query, postFilter, aggs } = construirQuery(params);

  const { hits, aggregations } = await esClient.search({
    index: "productos",
    from: (pagina - 1) * tamanoPagina,
    size: tamanoPagina,
    query,
    post_filter: postFilter,
    aggs,
    sort: construirOrden(params),
  });

  const respuesta = {
    productos: hits.hits.map((h) => ({ id: h._id, ...h._source })),
    total: hits.total.value,
    pagina,
    tamanoPagina,
    sugerenciaTermino: null,
    categoriasPopulares: [],
    facetas: formatearFacetas(aggregations),
  };

  // Alternativas (HU-SRCH-04): solo con texto, 0 resultados y SIN filtros activos
  if (respuesta.total === 0 && q && !hayFiltros(params)) {
    const alternativas = await alternativasParaSinResultados(q, pagina, tamanoPagina);
    return { ...alternativas, facetas: respuesta.facetas };
  }
  return respuesta;
}

module.exports = { buscarProductos };

const esClient = require("../infrastructure/elasticsearch/client");
const { construirQuery } = require("./construirQuery");
const { construirOrden } = require("./orden");
const { alternativasParaSinResultados } = require("./manejarSinResultados");
const filtroCategoria = require("./filtros/categoria");
const filtroPrecio = require("./filtros/precio");

async function buscarProductos(paramsOrQ, pagina = 1, tamanoPagina = 20) {
  // Compatibilidad hacia atrás: si recibe string
  let params = {};
  if (typeof paramsOrQ === "string") {
    params = { q: paramsOrQ, pagina, tamanoPagina };
  } else if (typeof paramsOrQ === "object" && paramsOrQ !== null) {
    params = paramsOrQ;
  }

  const q = params.q || "";
  const pag = params.pagina || pagina;
  const tamPag = params.tamanoPagina || tamanoPagina;

  // Construir filtros
  const filtros = [];
  const catClause = filtroCategoria.clausula({ categorias: params.categoria });
  if (catClause) filtros.push(catClause);
  const priceClause = filtroPrecio.clausula({ minPrice: params.minPrice, maxPrice: params.maxPrice });
  if (priceClause) filtros.push(priceClause);

  const { query, postFilter, aggs } = construirQuery(params);
  const sort = construirOrden({ orden: params.orden, direccion: params.direccion });

  const searchParams = {
    index: "productos",
    from: (pag - 1) * tamPag,
    size: tamPag,
    query,
    sort,
  };

  if (postFilter) searchParams.post_filter = postFilter;
  if (aggs) searchParams.aggs = aggs;

  const response = await esClient.search(searchParams);
  const hits = response.hits;
  const aggregations = response.aggregations;

  const productos = hits.hits.map((h) => ({ id: h._id, ...h._source }));
  const total = hits.total?.value ?? 0;

  // Formatear facetas
  let facetas = { categorias: [] };
  if (aggregations?.categorias?.buckets) {
    facetas.categorias = aggregations.categorias.buckets.map((b) => ({
      key: b.key,
      doc_count: b.doc_count,
    }));
  } else if (aggregations?.categorias_populares?.buckets) {
    facetas.categorias = aggregations.categorias_populares.buckets.map((b) => ({
      key: b.key,
      doc_count: b.doc_count,
    }));
  }

  // Si no hay resultados, con texto de búsqueda y sin filtros activos
  const hayFiltrosActivos =
    (Array.isArray(params.categoria) && params.categoria.length > 0) ||
    params.minPrice !== undefined ||
    params.maxPrice !== undefined;

  if (total === 0 && q && !hayFiltrosActivos) {
    const alt = await alternativasParaSinResultados(q, pag, tamPag);
    return {
      ...alt,
      facetas,
      categoriasPopulares: alt.categoriasPopulares || facetas.categorias,
    };
  }

  return {
    productos,
    total,
    pagina: pag,
    tamanoPagina: tamPag,
    sugerenciaTermino: null,
    categoriasPopulares: facetas.categorias,
    facetas,
  };
}

module.exports = { buscarProductos };

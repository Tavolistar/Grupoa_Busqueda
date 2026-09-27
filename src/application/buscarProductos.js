const esClient = require("../infrastructure/elasticsearch/client");
 
async function buscarProductos(q, pagina = 1, tamanoPagina = 20) {
  const { hits } = await esClient.search({
    index: "productos",
    from: (pagina - 1) * tamanoPagina,
    size: tamanoPagina,
    query: {
      bool: {
        must: q ? { multi_match: { query: q, fields: ["nombre^2"], type: "best_fields" } } : { match_all: {} },
        filter: { term: { activo: true } },
      },
    },
  });
  return {
    productos: hits.hits.map((h) => ({ id: h._id, ...h._source })),
    total: hits.total.value,
    pagina, tamanoPagina,
    sugerenciaTermino: null,
    categoriasPopulares: [],
  };
}
module.exports = { buscarProductos };

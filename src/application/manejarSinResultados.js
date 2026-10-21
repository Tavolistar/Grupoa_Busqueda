const esClient = require("../infrastructure/elasticsearch/client");
const { obtenerSugerencias } = require("./obtenerSugerencias");

// Top N categorías por cantidad de productos activos
async function obtenerCategoriasPopulares(n = 5) {
  const { aggregations } = await esClient.search({
    index: "productos",
    size: 0,
    query: { term: { activo: true } },
    aggs: { categorias: { terms: { field: "categoria", size: n } } },
  });
  return aggregations.categorias.buckets.map((b) => ({
    id: b.key,
    nombre: String(b.key).replace(/^cat-/, ""),
  }));
}

async function alternativasParaSinResultados(q, pagina, tamanoPagina) {
  let sugerenciaTermino = null;
  try {
    // Si falla el autocompletado, igual devolvemos las categorías populares
    const { sugerencias } = await obtenerSugerencias(q.slice(0, 3));
    sugerenciaTermino =
      sugerencias.find((s) => s.tipo === "termino")?.texto ??
      sugerencias.find((s) => s.tipo === "producto")?.texto ??
      null;
  } catch (err) {
    console.error("No se pudo obtener sugerencia de término:", err.message);
  }

  const categoriasPopulares = await obtenerCategoriasPopulares();

  return {
    productos: [],
    total: 0,
    pagina,
    tamanoPagina,
    sugerenciaTermino,
    categoriasPopulares, // ej: [{ id: "cat-ropa", nombre: "ropa" }]
  };
}

module.exports = { alternativasParaSinResultados, obtenerCategoriasPopulares };
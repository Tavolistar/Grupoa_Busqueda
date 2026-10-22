// src/application/manejarSinResultados.js  (HU-SRCH-04-BE)
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

async function alternativasParaSinResultados(q, pagina = 1, tamanoPagina = 20) {
  let sugerenciaTermino = null;
  try {
    const { sugerencias } = await obtenerSugerencias(String(q).slice(0, 3));
    sugerenciaTermino =
      sugerencias.find((s) => s.tipo === "termino")?.texto ??
      sugerencias.find((s) => s.tipo === "producto")?.texto ??
      null;
  } catch (err) {
    console.error("No se pudo obtener sugerencia de término:", err.message);
  }

  let categoriasPopulares = [];
  try {
    categoriasPopulares = await obtenerCategoriasPopulares();
  } catch (err) {
    console.error("No se pudieron obtener categorías populares:", err.message);
  }

  return {
    productos: [],
    total: 0,
    pagina,
    tamanoPagina,
    sugerenciaTermino,
    categoriasPopulares,
    facetas: { categorias: [] },
  };
}

module.exports = { alternativasParaSinResultados, obtenerCategoriasPopulares };

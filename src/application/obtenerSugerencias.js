const esClient = require("../infrastructure/elasticsearch/client");

const CARACTERES_MINIMOS = 2;

async function sugerirCategorias(q) {
  const res = await esClient.search({
    index: "productos",
    size: 0,
    query: {
      bool: {
        filter: { term: { activo: true } },
        must: { match_phrase_prefix: { nombre: q } },
      },
    },
    aggs: { categorias: { terms: { field: "categoria", size: 3 } } },
  });
  return res.aggregations.categorias.buckets.map((b) => ({
    tipo: "categoria",
    texto: b.key,
  }));
}

async function obtenerSugerencias(q = "") {
  if (q.trim().length < CARACTERES_MINIMOS) return { sugerencias: [] };

  const { suggest } = await esClient.search({
    index: "productos",
    suggest: {
      productos: {
        prefix: q,
        completion: { field: "sugerencia", size: 5, fuzzy: { fuzziness: 1 } },
      },
    },
  });

  const productos = suggest.productos[0].options.map((o) => ({
    tipo: "producto",
    texto: o.text,
  }));
  const categorias = await sugerirCategorias(q);

  return { sugerencias: [...productos, ...categorias] };
}

module.exports = { obtenerSugerencias, sugerirCategorias };
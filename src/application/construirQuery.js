// src/application/construirQuery.js  (Fase 0 · Juan Pablo; Javier lo extiende en HU-SRCH-08-BE)
const categoria = require("./filtros/categoria");
const precio = require("./filtros/precio");

function consultaTexto(q) {
  if (!q) return { match_all: {} };
  return {
    multi_match: {
      query: q,
      fields: ["nombre^2", "descripcion"],
      type: "best_fields",
      fuzziness: "AUTO",   // HU-SRCH-03
      prefix_length: 1,
    },
  };
}

function construirQuery(params) {
  const filter = [{ term: { activo: true } }];
  const clausulaPrecio = precio.clausula(params);
  if (clausulaPrecio) filter.push(clausulaPrecio);

  return {
    query: { bool: { must: [consultaTexto(params.q)], filter } },
    // La categoría va en post_filter para que las facetas NO se reduzcan al elegir una categoría
    postFilter: categoria.clausula(params) ?? undefined,
    aggs: categoria.agregacion(params) ?? undefined,
  };
}

module.exports = { construirQuery, consultaTexto };

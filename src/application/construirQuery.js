const categoria = require("./filtros/categoria");
const precio = require("./filtros/precio");

function consultaTexto(q) {
  if (!q || q === "") {
    return { match_all: {} };
  }
  return {
    multi_match: {
      query: q,
      fields: ["nombre^2", "descripcion"],
      type: "best_fields",
      fuzziness: "AUTO",
      prefix_length: 1,
    },
  };
}

function construirQuery(params = {}) {
  const filter = [{ term: { activo: true } }];

  const precioClause = precio.clausula(params);
  if (precioClause) {
    filter.push(precioClause);
  }

  const query = {
    bool: {
      must: [consultaTexto(params.q)],
      filter,
    },
  };

  const postFilter = categoria.clausula(params) || undefined;
  const aggs = categoria.agregacion();

  const result = { query, postFilter, aggs };
  if (postFilter === undefined) {
    delete result.postFilter;
  }
  return result;
}

module.exports = { construirQuery, consultaTexto };

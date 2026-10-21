function construirQuery(params = {}) {
  // Esqueleto base - se integra con filtros
  const must = [];
  if (params.q) {
    must.push({
      multi_match: {
        query: params.q,
        fields: ["nombre^2"],
        type: "best_fields",
        fuzziness: "AUTO",
        prefix_length: 1,
      },
    });
  } else {
    must.push({ match_all: {} });
  }

  const filter = [{ term: { activo: true } }];
  // Los filtros se pueden añadir desde fuera
  if (params._filtros && Array.isArray(params._filtros)) {
    filter.push(...params._filtros.filter(Boolean));
  }

  return {
    bool: {
      must,
      filter,
    },
  };
}

module.exports = { construirQuery };

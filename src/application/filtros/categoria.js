function clausula({ categorias }) {
  if (!categorias || (Array.isArray(categorias) && categorias.length === 0)) {
    return null;
  }
  const cats = Array.isArray(categorias) ? categorias : [categorias];
  return { terms: { categoria: cats } };
}

function agregacion() {
  return {
    categorias_populares: {
      terms: { field: "categoria", size: 10 },
    },
  };
}

module.exports = { clausula, agregacion };

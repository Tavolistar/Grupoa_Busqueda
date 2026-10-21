function clausula(arg = {}) {
  let categorias;
  if (Array.isArray(arg)) {
    categorias = arg;
  } else if (arg.categorias !== undefined) {
    categorias = arg.categorias;
  } else if (arg.categoria !== undefined) {
    categorias = arg.categoria;
  } else {
    return null;
  }

  if (!categorias || (Array.isArray(categorias) && categorias.length === 0)) {
    return null;
  }
  const cats = Array.isArray(categorias) ? categorias : [categorias];
  if (cats.length === 0) return null;
  return { terms: { categoria: cats } };
}

function agregacion() {
  return {
    categorias: {
      terms: { field: "categoria", size: 20 },
    },
  };
}

module.exports = { clausula, agregacion };

function aNumero(valor) {
  return valor === undefined || valor === "" ? undefined : Number(valor);
}

function parsearParametros(query) {
  const {
    q = "",
    categoria,
    minPrice,
    maxPrice,
    orden = "relevancia",
    direccion = "asc",
    pagina = 1,
    tamanoPagina = 20,
  } = query;

  const categoriasCrudas = []
    .concat(categoria ?? [])
    .flatMap((c) => String(c).split(","))
    .map((c) => c.trim())
    .filter(Boolean);

  const categorias = [...new Set(categoriasCrudas)];

  return {
    q: String(q).trim(),
    categorias,
    minPrice: aNumero(minPrice),
    maxPrice: aNumero(maxPrice),
    orden,
    direccion,
    pagina: Math.max(1, Number(pagina) || 1),
    tamanoPagina: Math.min(100, Math.max(1, Number(tamanoPagina) || 20)),
  };
}
module.exports = { parsearParametros };

function parsearParametros(query = {}) {
  const params = {};

  // categoria: soportar repetidos o separados por comas
  if (query.categoria) {
    if (Array.isArray(query.categoria)) {
      params.categoria = query.categoria
        .flatMap((c) => String(c).split(","))
        .map((c) => c.trim())
        .filter((c) => c);
    } else {
      params.categoria = String(query.categoria)
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);
    }
  }

  // precios
  if (query.minPrice !== undefined && query.minPrice !== null && query.minPrice !== "") {
    const v = Number(query.minPrice);
    if (!Number.isNaN(v)) params.minPrice = v;
  }
  if (query.maxPrice !== undefined && query.maxPrice !== null && query.maxPrice !== "") {
    const v = Number(query.maxPrice);
    if (!Number.isNaN(v)) params.maxPrice = v;
  }

  // orden y direccion
  params.orden = query.orden || "relevancia";
  params.direccion = query.direccion || "asc";

  // paginacion
  let pagina = Number(query.pagina);
  if (Number.isNaN(pagina) || pagina < 1) pagina = 1;
  params.pagina = pagina;

  let tamanoPagina = Number(query.tamanoPagina);
  if (Number.isNaN(tamanoPagina)) tamanoPagina = 20;
  if (tamanoPagina < 1) tamanoPagina = 1;
  if (tamanoPagina > 100) tamanoPagina = 100;
  params.tamanoPagina = tamanoPagina;

  params.q = query.q || "";

  return params;
}

module.exports = { parsearParametros };

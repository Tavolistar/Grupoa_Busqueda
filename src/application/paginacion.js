const MAX_RESULT_WINDOW = 10000;

function validarPaginacion({ pagina, tamanoPagina }) {
  if (pagina * tamanoPagina > MAX_RESULT_WINDOW) {
    return `pagina * tamanoPagina no puede superar ${MAX_RESULT_WINDOW}`;
  }
  return null;
}

function crearMetadatosPaginacion(total, pagina, tamanoPagina) {
  const totalPaginas = Math.ceil(total / tamanoPagina);
  return {
    totalPaginas,
    hayAnterior: pagina > 1,
    haySiguiente: pagina < totalPaginas,
  };
}

module.exports = { validarPaginacion, crearMetadatosPaginacion };

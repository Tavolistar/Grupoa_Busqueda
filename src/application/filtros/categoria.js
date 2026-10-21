// src/application/filtros/categoria.js
// TODO(Andrés David · HU-SRCH-06-BE)
// clausula: devolver { terms: { categoria: params.categorias } } si hay categorías, o null si no.
// agregacion: devolver { categorias: { terms: { field: "categoria", size: 20 } } }
function clausula(/* params */) {
  return null;
}

function agregacion(/* params */) {
  return null;
}

module.exports = { clausula, agregacion };

// src/application/orden.js
// TODO(Andrés David · HU-SRCH-09-BE): ordenar por precio / nombre según params.orden y params.direccion.
// Pista: nombre -> "nombre.keyword"; mantener { id: "asc" } al final como desempate estable.
function construirOrden(/* { orden, direccion } */) {
  return ["_score", { id: "asc" }]; // por ahora, solo relevancia
}

module.exports = { construirOrden };

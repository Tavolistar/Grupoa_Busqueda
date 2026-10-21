const CAMPOS = {
  relevancia: null,
  precio: "precio",
  nombre: "nombre.keyword",
};

function validar({ orden, direccion }) {
  const ordenesValidos = ["relevancia", "precio", "nombre"];
  const direccionesValidas = ["asc", "desc"];
  if (orden && !ordenesValidos.includes(orden)) {
    return "orden debe ser relevancia, precio o nombre";
  }
  if (direccion && !direccionesValidas.includes(direccion)) {
    return "direccion debe ser asc o desc";
  }
  return null;
}

function construirOrden({ orden, direccion }) {
  const dir = direccion || "asc";
  if (!orden || orden === "relevancia") {
    return ["_score", { id: { order: "asc", unmapped_type: "keyword" } }];
  }
  if (orden === "precio") {
    return [{ precio: { order: dir } }, { id: { order: "asc", unmapped_type: "keyword" } }];
  }
  if (orden === "nombre") {
    return [{ "nombre.keyword": { order: dir } }, { id: { order: "asc", unmapped_type: "keyword" } }];
  }
  return ["_score", { id: { order: "asc", unmapped_type: "keyword" } }];
}

module.exports = { validar, construirOrden };

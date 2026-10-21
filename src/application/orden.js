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
    return ["_score", { id: "asc" }];
  }
  if (orden === "precio") {
    return [{ precio: { order: dir } }, { id: "asc" }];
  }
  if (orden === "nombre") {
    return [{ "nombre.keyword": { order: dir } }, { id: "asc" }];
  }
  return ["_score", { id: "asc" }];
}

module.exports = { validar, construirOrden };

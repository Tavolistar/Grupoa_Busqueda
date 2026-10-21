function validar({ orden, direccion }) {
  const ordenesValidos = ["relevancia", "precio", "nombre"];
  const direccionesValidas = ["asc", "desc"];
  if (orden && !ordenesValidos.includes(orden)) {
    throw new Error("orden inválido");
  }
  if (direccion && !direccionesValidas.includes(direccion)) {
    throw new Error("direccion inválida");
  }
  return true;
}

function construirOrden({ orden, direccion }) {
  if (!orden || orden === "relevancia") {
    return ["_score"];
  }
  if (orden === "precio") {
    return [{ precio: { order: direccion || "asc" } }];
  }
  if (orden === "nombre") {
    return [{ nombre: { order: direccion || "asc" } }];
  }
  return ["_score"];
}

module.exports = { validar, construirOrden };

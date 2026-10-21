// src/application/parametros.js  (Fase 0 · Juan Pablo)
const ORDENES = ["relevancia", "precio", "nombre"];
const DIRECCIONES = ["asc", "desc"];

function aNumero(valor) {
  return valor === undefined || valor === "" ? undefined : Number(valor);
}

function parsearParametros(query) {
  const {
    q = "", categoria, minPrice, maxPrice,
    orden = "relevancia", direccion = "asc", pagina = 1, tamanoPagina = 20,
  } = query;

  // categoria puede venir repetida (?categoria=a&categoria=b) o separada por comas
  const categorias = [].concat(categoria ?? [])
    .flatMap((c) => String(c).split(","))
    .map((c) => c.trim())
    .filter(Boolean);

  return {
    q: String(q).trim(),
    categorias: [...new Set(categorias)].sort(), // ordenadas: sirven para la clave de caché
    minPrice: aNumero(minPrice),
    maxPrice: aNumero(maxPrice),
    orden,
    direccion,
    pagina: Math.max(1, Number(pagina) || 1),
    tamanoPagina: Math.min(100, Math.max(1, Number(tamanoPagina) || 20)),
  };
}

// Devuelven un mensaje de error (string) o null si todo está bien
function validarPrecio({ minPrice, maxPrice }) {
  for (const [nombre, valor] of [["minPrice", minPrice], ["maxPrice", maxPrice]]) {
    if (valor === undefined) continue;
    if (Number.isNaN(valor)) return `${nombre} debe ser numérico`;
    if (valor < 0) return `${nombre} no puede ser negativo`;
  }
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return "minPrice no puede ser mayor que maxPrice";
  }
  return null;
}

function validarOrden({ orden, direccion }) {
  if (!ORDENES.includes(orden)) return `orden inválido (use: ${ORDENES.join(", ")})`;
  if (!DIRECCIONES.includes(direccion)) return `direccion inválida (use: ${DIRECCIONES.join(", ")})`;
  return null;
}

module.exports = { parsearParametros, validarPrecio, validarOrden, ORDENES, DIRECCIONES };

function validar({ minPrice, maxPrice }) {
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new Error("minPrice no puede ser mayor a maxPrice");
  }
  return true;
}

function clausula({ minPrice, maxPrice }) {
  const range = {};
  if (minPrice !== undefined) range.gte = minPrice;
  if (maxPrice !== undefined) range.lte = maxPrice;
  if (Object.keys(range).length === 0) return null;
  return { range: { precio: range } };
}

module.exports = { validar, clausula };

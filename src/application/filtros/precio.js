function validar({ minPrice, maxPrice }) {
  const check = (v) => {
    if (v === undefined || v === null) return null;
    const num = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(num) || num < 0) {
      return "minPrice y maxPrice deben ser números mayores o iguales a 0";
    }
    return null;
  };

  const errMin = check(minPrice);
  if (errMin) return errMin;
  const errMax = check(maxPrice);
  if (errMax) return errMax;

  if (minPrice !== undefined && minPrice !== null && maxPrice !== undefined && maxPrice !== null) {
    const nMin = typeof minPrice === "number" ? minPrice : Number(minPrice);
    const nMax = typeof maxPrice === "number" ? maxPrice : Number(maxPrice);
    if (Number.isFinite(nMin) && Number.isFinite(nMax) && nMin > nMax) {
      return "minPrice no puede ser mayor que maxPrice";
    }
  }
  return null;
}

function clausula({ minPrice, maxPrice }) {
  if (minPrice === undefined && maxPrice === undefined) return null;
  if (minPrice === null && maxPrice === null) return null;
  const range = {};
  if (minPrice !== undefined && minPrice !== null) {
    range.gte = typeof minPrice === "number" ? minPrice : Number(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== null) {
    range.lte = typeof maxPrice === "number" ? maxPrice : Number(maxPrice);
  }
  if (Object.keys(range).length === 0) return null;
  return { range: { precio: range } };
}

module.exports = { validar, clausula };

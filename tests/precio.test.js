const { validar, clausula } = require("../src/application/filtros/precio");

describe("Filtro por precio", () => {
  test("precios negativos o no numéricos devuelven error", () => {
    expect(validar({ minPrice: -1 })).toBe("minPrice y maxPrice deben ser números mayores o iguales a 0");
    expect(validar({ maxPrice: -5 })).toBe("minPrice y maxPrice deben ser números mayores o iguales a 0");
    expect(validar({ minPrice: "abc" })).toBe("minPrice y maxPrice deben ser números mayores o iguales a 0");
  });

  test("minPrice > maxPrice devuelve mensaje de error", () => {
    expect(validar({ minPrice: 100, maxPrice: 50 })).toBe("minPrice no puede ser mayor que maxPrice");
  });

  test("clausula genera objeto range inclusivo", () => {
    expect(clausula({ minPrice: 10, maxPrice: 100 })).toEqual({ range: { precio: { gte: 10, lte: 100 } } });
    expect(clausula({ minPrice: 10 })).toEqual({ range: { precio: { gte: 10 } } });
    expect(clausula({ maxPrice: 100 })).toEqual({ range: { precio: { lte: 100 } } });
  });
});

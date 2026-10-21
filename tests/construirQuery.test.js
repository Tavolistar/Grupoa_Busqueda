const { construirQuery } = require("../src/application/construirQuery");

describe("ConstruirQuery composición de filtros", () => {
  test("siempre incluye filtro de productos activos", () => {
    const res = construirQuery({ q: "" });
    expect(res.query.bool.filter).toEqual([{ term: { activo: true } }]);
  });

  test("el rango de precio va dentro de query.bool.filter", () => {
    const res = construirQuery({ q: "camisa", minPrice: 10, maxPrice: 100 });
    expect(res.query.bool.filter).toContainEqual({ term: { activo: true } });
    expect(res.query.bool.filter).toContainEqual({ range: { precio: { gte: 10, lte: 100 } } });
  });

  test("la categoría va asignada a postFilter", () => {
    const res = construirQuery({ q: "camisa", categoria: ["cat-ropa"] });
    expect(res.postFilter).toEqual({ terms: { categoria: ["cat-ropa"] } });
  });
});

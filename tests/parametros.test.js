const { parsearParametros, validarPrecio, validarOrden } = require("../src/application/parametros");

describe("parsearParametros", () => {
  test("valores por defecto", () => {
    expect(parsearParametros({})).toEqual({
      q: "", categorias: [], minPrice: undefined, maxPrice: undefined,
      orden: "relevancia", direccion: "asc", pagina: 1, tamanoPagina: 20,
    });
  });
  test("categoria repetida y separada por comas, sin duplicados y ordenada", () => {
    expect(parsearParametros({ categoria: ["cat-ropa", "cat-zapatos,cat-ropa"] }).categorias)
      .toEqual(["cat-ropa", "cat-zapatos"]);
  });
  test("convierte precios a número y limita tamanoPagina", () => {
    const p = parsearParametros({ minPrice: "100", maxPrice: "300", tamanoPagina: "500" });
    expect(p.minPrice).toBe(100);
    expect(p.maxPrice).toBe(300);
    expect(p.tamanoPagina).toBe(100);
  });
  test("recorta el texto", () => {
    expect(parsearParametros({ q: "  camisa " }).q).toBe("camisa");
  });
});

describe("validarPrecio", () => {
  test("sin precios es válido", () => expect(validarPrecio({})).toBeNull());
  test("rango inclusivo igual es válido", () => expect(validarPrecio({ minPrice: 5, maxPrice: 5 })).toBeNull());
  test("min > max", () => expect(validarPrecio({ minPrice: 10, maxPrice: 5 })).toMatch(/mayor/));
  test("negativo", () => expect(validarPrecio({ minPrice: -1 })).toMatch(/negativo/));
  test("no numérico", () => expect(validarPrecio(parsearParametros({ maxPrice: "abc" }))).toMatch(/numérico/));
});

describe("validarOrden", () => {
  test("válidos", () => expect(validarOrden({ orden: "precio", direccion: "desc" })).toBeNull());
  test("orden inválido", () => expect(validarOrden({ orden: "color", direccion: "asc" })).toMatch(/orden inválido/));
  test("dirección inválida", () => expect(validarOrden({ orden: "precio", direccion: "x" })).toMatch(/direccion/));
});

const { clausula, agregacion } = require("../src/application/filtros/categoria");

describe("Filtro por categoría", () => {
  test("sin categorías devuelve null", () => {
    expect(clausula({ categorias: [] })).toBeNull();
    expect(clausula({ categorias: undefined })).toBeNull();
  });

  test("con array de categorías devuelve estructura terms", () => {
    const result = clausula({ categorias: ["cat-ropa", "cat-zapatos"] });
    expect(result).toEqual({ terms: { categoria: ["cat-ropa", "cat-zapatos"] } });
  });
});

const { validar, construirOrden } = require("../src/application/orden");

describe("Ordenamiento", () => {
  test("validar retorna mensaje si orden o dirección inválidos", () => {
    expect(validar({ orden: "invalido", direccion: "asc" })).toBe("orden debe ser relevancia, precio o nombre");
    expect(validar({ orden: "precio", direccion: "arriba" })).toBe("direccion debe ser asc o desc");
  });

  test("construirOrden genera estructura con desempate por id", () => {
    expect(construirOrden({ orden: "precio", direccion: "desc" })).toEqual([
      { precio: { order: "desc" } },
      { id: "asc" },
    ]);
    expect(construirOrden({ orden: "nombre", direccion: "asc" })).toEqual([
      { "nombre.keyword": { order: "asc" } },
      { id: "asc" },
    ]);
    expect(construirOrden({ orden: "relevancia" })).toEqual(["_score", { id: "asc" }]);
  });
});

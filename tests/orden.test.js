const { validar, construirOrden } = require("../src/application/orden");

describe("Ordenamiento", () => {
  test("validar retorna mensaje si orden o dirección inválidos", () => {
    expect(validar({ orden: "invalido", direccion: "asc" })).toBe("orden debe ser relevancia, precio o nombre");
    expect(validar({ orden: "precio", direccion: "arriba" })).toBe("direccion debe ser asc o desc");
  });

  test("construirOrden genera estructura de ordenamiento correcta con desempate por id", () => {
    expect(construirOrden({ orden: "precio", direccion: "desc" })[1]).toEqual({
      id: { order: "asc", unmapped_type: "keyword" },
    });
    expect(construirOrden({ orden: "nombre", direccion: "asc" })[1]).toEqual({
      id: { order: "asc", unmapped_type: "keyword" },
    });
    expect(construirOrden({ orden: "relevancia" })[1]).toEqual({
      id: { order: "asc", unmapped_type: "keyword" },
    });
  });
});

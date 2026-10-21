const { construirQuery } = require("../src/application/construirQuery");
const base = { q: "", categorias: [], orden: "relevancia", direccion: "asc" };

test("sin texto usa match_all y siempre filtra por activo", () => {
  const { query } = construirQuery(base);
  expect(query.bool.must).toEqual([{ match_all: {} }]);
  expect(query.bool.filter).toContainEqual({ term: { activo: true } });
});

test("con texto usa multi_match con fuzziness AUTO (HU-SRCH-03)", () => {
  const { query } = construirQuery({ ...base, q: "camiza" });
  const mm = query.bool.must[0].multi_match;
  expect(mm.query).toBe("camiza");
  expect(mm.fuzziness).toBe("AUTO");
  expect(mm.fields).toEqual(["nombre^2", "descripcion"]);
});

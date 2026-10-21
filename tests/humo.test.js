const request = require("supertest");

jest.mock("../src/infrastructure/elasticsearch/client", () => ({ search: jest.fn() }));
jest.mock("../src/application/obtenerSugerencias", () => ({ obtenerSugerencias: jest.fn().mockResolvedValue({ sugerencias: [] }) }));
jest.mock("../src/application/manejarSinResultados", () => ({
  alternativasParaSinResultados: jest.fn().mockResolvedValue({
    productos: [], total: 0, pagina: 1, tamanoPagina: 20,
    sugerenciaTermino: "camisa", categoriasPopulares: [{ id: "cat-ropa", nombre: "ropa" }],
  }),
}));

const esClient = require("../src/infrastructure/elasticsearch/client");
const { alternativasParaSinResultados } = require("../src/application/manejarSinResultados");
const { app } = require("../src/infrastructure/http/server");

const respuestaEs = (hits = []) => ({
  hits: { hits, total: { value: hits.length } },
  aggregations: { categorias: { buckets: [{ key: "cat-ropa", doc_count: 1 }] } },
});

beforeEach(() => jest.clearAllMocks());

test("GET /productos?q=camisa responde 200 con la forma del contrato v1.1", async () => {
  esClient.search.mockResolvedValue(respuestaEs([{ _id: "p1", _source: { nombre: "Camisa azul", precio: 50000 } }]));
  const res = await request(app).get("/api/busqueda/productos?q=camisa");
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ total: 1, pagina: 1, tamanoPagina: 20, sugerenciaTermino: null, categoriasPopulares: [] });
  expect(res.body.productos[0]).toMatchObject({ id: "p1", nombre: "Camisa azul" });
  expect(res.body.facetas.categorias).toEqual([{ id: "cat-ropa", nombre: "ropa", total: 1 }]);
});

test("minPrice > maxPrice responde 400 sin consultar Elasticsearch", async () => {
  const res = await request(app).get("/api/busqueda/productos?minPrice=500&maxPrice=100");
  expect(res.status).toBe(400);
  expect(res.body.error).toMatch(/minPrice/);
  expect(esClient.search).not.toHaveBeenCalled();
});

test("orden inválido responde 400", async () => {
  const res = await request(app).get("/api/busqueda/productos?orden=color");
  expect(res.status).toBe(400);
});

test("0 resultados con texto y sin filtros devuelve alternativas (HU-SRCH-04)", async () => {
  esClient.search.mockResolvedValue(respuestaEs([]));
  const res = await request(app).get("/api/busqueda/productos?q=xyz");
  expect(alternativasParaSinResultados).toHaveBeenCalled();
  expect(res.body.sugerenciaTermino).toBe("camisa");
});

test("0 resultados CON filtros no devuelve alternativas", async () => {
  esClient.search.mockResolvedValue(respuestaEs([]));
  const res = await request(app).get("/api/busqueda/productos?q=xyz&minPrice=10");
  expect(alternativasParaSinResultados).not.toHaveBeenCalled();
  expect(res.body.total).toBe(0);
});

test("error interno de Elasticsearch responde 500 sin romper el servidor", async () => {
  esClient.search.mockRejectedValue(new Error("ES caído"));
  jest.spyOn(console, "error").mockImplementation(() => {});
  const res = await request(app).get("/api/busqueda/productos?q=a");
  expect(res.status).toBe(500);
});

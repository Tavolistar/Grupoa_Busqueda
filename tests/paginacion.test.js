jest.mock("../src/infrastructure/elasticsearch/client", () => ({
  search: jest.fn(),
}));

const request = require("supertest");
const esClient = require("../src/infrastructure/elasticsearch/client");
const { app } = require("../src/infrastructure/http/server");
const {
  validarPaginacion,
  crearMetadatosPaginacion,
} = require("../src/application/paginacion");
const { buscarProductos } = require("../src/application/buscarProductos");

describe("Paginación", () => {
  beforeEach(() => {
    esClient.search.mockReset();
  });

  test("rechaza páginas cuya ventana supera 10000 resultados", () => {
    expect(validarPaginacion({ pagina: 101, tamanoPagina: 100 })).toMatch(/10000/);
    expect(validarPaginacion({ pagina: 100, tamanoPagina: 100 })).toBeNull();
  });

  test("calcula total de páginas y disponibilidad de anterior/siguiente", () => {
    expect(crearMetadatosPaginacion(5, 1, 2)).toEqual({
      totalPaginas: 3,
      hayAnterior: false,
      haySiguiente: true,
    });
    expect(crearMetadatosPaginacion(5, 3, 2)).toEqual({
      totalPaginas: 3,
      hayAnterior: true,
      haySiguiente: false,
    });
    expect(crearMetadatosPaginacion(0, 1, 2)).toEqual({
      totalPaginas: 0,
      hayAnterior: false,
      haySiguiente: false,
    });
  });

  test("responde 400 sin consultar Elasticsearch cuando la página excede el límite", async () => {
    const response = await request(app)
      .get("/api/busqueda/productos")
      .query({ pagina: 101, tamanoPagina: 100 });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toMatch(/10000/);
    expect(esClient.search).not.toHaveBeenCalled();
  });

  test("devuelve metadatos y no repite productos entre páginas", async () => {
    const productos = Array.from({ length: 250 }, (_, index) => ({
      _id: `p${index + 1}`,
      _source: { nombre: `Producto ${index + 1}` },
    }));

    esClient.search.mockImplementation(async ({ from, size }) => ({
      hits: {
        total: { value: productos.length },
        hits: productos.slice(from, from + size),
      },
    }));

    const respuestas = await Promise.all([
      buscarProductos({ pagina: 1, tamanoPagina: 100 }),
      buscarProductos({ pagina: 2, tamanoPagina: 100 }),
      buscarProductos({ pagina: 3, tamanoPagina: 100 }),
    ]);

    expect(respuestas.map(({ totalPaginas, hayAnterior, haySiguiente }) => ({
      totalPaginas,
      hayAnterior,
      haySiguiente,
    }))).toEqual([
      { totalPaginas: 3, hayAnterior: false, haySiguiente: true },
      { totalPaginas: 3, hayAnterior: true, haySiguiente: true },
      { totalPaginas: 3, hayAnterior: true, haySiguiente: false },
    ]);

    const ids = respuestas.flatMap(({ productos: pagina }) => pagina.map(({ id }) => id));
    expect(ids).toEqual(productos.map(({ _id }) => _id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(esClient.search.mock.calls.map(([params]) => params.from)).toEqual([0, 100, 200]);
  });
});

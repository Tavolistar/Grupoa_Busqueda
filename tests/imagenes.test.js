// tests/imagenes.test.js
//
// Catalogo v2.6: verifica que el campo `imagenes` (arreglo de strings) se conserve
// íntegro en la respuesta de búsqueda y que exista en el mapping del índice.

jest.mock("../src/infrastructure/elasticsearch/client", () => ({
  search: jest.fn(),
  ping: jest.fn(),
  indices: { exists: jest.fn(), create: jest.fn() },
}));

const esClient = require("../src/infrastructure/elasticsearch/client");
const { buscarProductos } = require("../src/application/buscarProductos");
const { mappings } = require("../src/infrastructure/elasticsearch/productoIndex");

describe("campo imagenes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("el mapping del índice declara imagenes como keyword", () => {
    expect(mappings.properties.imagenes).toBeDefined();
    expect(mappings.properties.imagenes.type).toBe("keyword");
  });

  test("buscarProductos devuelve imagenes tal cual vienen en _source", async () => {
    const imagenes = ["/img/camisa-1.jpg", "/img/camisa-2.jpg"];
    esClient.search.mockResolvedValue({
      hits: {
        total: { value: 1 },
        hits: [
          {
            _id: "p1",
            _source: { nombre: "Camisa azul", categoria: "cat-ropa", precio: 50000, imagenes },
          },
        ],
      },
      aggregations: { categorias: { buckets: [] } },
    });

    const resultado = await buscarProductos({ q: "camisa" });

    expect(resultado.productos).toHaveLength(1);
    expect(resultado.productos[0].imagenes).toEqual(imagenes);
  });

  test("un producto sin imagenes no rompe la búsqueda", async () => {
    esClient.search.mockResolvedValue({
      hits: {
        total: { value: 1 },
        hits: [{ _id: "p2", _source: { nombre: "Gorra", categoria: "cat-accesorios", precio: 30000 } }],
      },
      aggregations: { categorias: { buckets: [] } },
    });

    const resultado = await buscarProductos({ q: "gorra" });

    expect(resultado.productos[0]).not.toHaveProperty("imagenes");
    expect(resultado.productos[0].nombre).toBe("Gorra");
  });
});
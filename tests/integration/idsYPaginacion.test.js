const request = require("supertest");
const { app } = require("../../src/infrastructure/http/server");

describe("Ids exactos y paginación (integración)", () => {
  test('buscar "camisa" devuelve exactamente los ids p1 y p4', async () => {
    const res = await request(app).get("/api/busqueda/productos?q=camisa");
    expect(res.statusCode).toBe(200);
    const ids = res.body.productos.map((p) => p.id).sort();
    expect(ids).toEqual(["p1", "p4"]);
  });

  test("paginación real: página 1 y 2 no se solapan y comparten total", async () => {
    const tam = 3;
    const p1 = await request(app).get(`/api/busqueda/productos?tamanoPagina=${tam}&pagina=1`);
    const p2 = await request(app).get(`/api/busqueda/productos?tamanoPagina=${tam}&pagina=2`);

    expect(p1.statusCode).toBe(200);
    expect(p2.statusCode).toBe(200);

    const ids1 = p1.body.productos.map((p) => p.id);
    const ids2 = p2.body.productos.map((p) => p.id);

    expect(ids1.length).toBeLessThanOrEqual(tam);
    expect(ids2.length).toBeLessThanOrEqual(tam);

    const interseccion = ids1.filter((id) => ids2.includes(id));
    expect(interseccion).toEqual([]);

    expect(p1.body.total).toBe(9);
    expect(p2.body.total).toBe(p1.body.total);
    expect(p1.body.totalPaginas).toBeGreaterThanOrEqual(3);
    expect(p2.body.totalPaginas).toBe(p1.body.totalPaginas);
  });
});

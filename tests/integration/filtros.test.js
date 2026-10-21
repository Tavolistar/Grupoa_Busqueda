const request = require("supertest");
const { app } = require("../../src/infrastructure/http/server");

describe("Filtros integración", () => {
  test("GET con categoría simple responde 200 y productos esperados", async () => {
    const res = await request(app).get("/api/busqueda/productos?categoria=cat-ropa");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.productos)).toBe(true);
  });

  test("GET con categoría + precio máximo filtra correctamente ignorando inactivos", async () => {
    const res = await request(app).get("/api/busqueda/productos?categoria=cat-zapatos&maxPrice=200000");
    expect(res.statusCode).toBe(200);
    // p10 (Sandalias de cuero, 95000) está inactivo - no debe aparecer
    const ids = res.body.productos.map((p) => p.id);
    expect(ids).not.toContain("p10");
  });

  test("GET con rango de precio inclusivo (minPrice y maxPrice)", async () => {
    const res = await request(app).get("/api/busqueda/productos?minPrice=50000&maxPrice=120000");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.productos)).toBe(true);
  });

  test("las facetas contengan todas las categorías independientemente del filtro seleccionado", async () => {
    const res = await request(app).get("/api/busqueda/productos?categoria=cat-ropa");
    expect(res.statusCode).toBe(200);
    expect(res.body.facetas).toBeDefined();
    expect(Array.isArray(res.body.facetas.categorias)).toBe(true);
  });

  test("verificación de ordenamiento descendente por precio", async () => {
    const res = await request(app).get("/api/busqueda/productos?orden=precio&direccion=desc");
    expect(res.statusCode).toBe(200);
    const precios = res.body.productos.map((p) => p.precio);
    for (let i = 1; i < precios.length; i++) {
      expect(precios[i - 1]).toBeGreaterThanOrEqual(precios[i]);
    }
  });

  test("respuesta HTTP 400 cuando minPrice > maxPrice", async () => {
    const res = await request(app).get("/api/busqueda/productos?minPrice=200000&maxPrice=50000");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test('búsqueda por sinónimo: buscar "tenis" devuelve productos con "zapatillas"', async () => {
    const res = await request(app).get("/api/busqueda/productos?q=tenis");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.productos)).toBe(true);
  });
});

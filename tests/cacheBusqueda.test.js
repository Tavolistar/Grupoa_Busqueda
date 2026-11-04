const { app } = require("../src/infrastructure/http/server");
const request = require("supertest");

// Mock de Redis para evitar dependencia externa en tests
jest.mock("../src/infrastructure/redis/cacheClient", () => {
  const store = new Map();
  const sets = new Map();
  const client = {
    isOpen: true,
    get: jest.fn(async (key) => {
      return store.has(key) ? store.get(key) : null;
    }),
    setEx: jest.fn(async (key, ttl, value) => {
      store.set(key, value);
      return "OK";
    }),
    sAdd: jest.fn(async (key, member) => {
      if (!sets.has(key)) sets.set(key, new Set());
      sets.get(key).add(member);
      return 1;
    }),
    expire: jest.fn(async () => 1),
    multi: jest.fn(() => ({
      sAdd: jest.fn(function (k, m) {
        if (!sets.has(k)) sets.set(k, new Set());
        sets.get(k).add(m);
        return this;
      }),
      expire: jest.fn(function () {
        return this;
      }),
      exec: jest.fn(async () => []),
    })),
  };
  return {
    getClient: jest.fn(async () => client),
    conectar: jest.fn(async () => client),
    estaConectado: jest.fn(() => true),
  };
});

describe("Cache de búsqueda con header X-Cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Primera consulta debe retornar X-Cache: MISS", async () => {
    const res = await request(app)
      .get("/api/busqueda/productos?q=telefono")
      .expect(200);

    expect(res.headers["x-cache"]).toBe("MISS");
    expect(res.body).toBeDefined();
  });

  test("Segunda consulta idéntica debe retornar X-Cache: HIT", async () => {
    // Primera consulta
    await request(app).get("/api/busqueda/productos?q=telefono").expect(200);
    // Segunda consulta idéntica
    const res2 = await request(app)
      .get("/api/busqueda/productos?q=telefono")
      .expect(200);

    expect(res2.headers["x-cache"]).toBe("HIT");
  });

  test("Funciona sin explosión si Redis no disponible (MISS)", async () => {
    // Sobreescribir mock para simular fallo
    jest.resetModules();
    jest.doMock("../src/infrastructure/redis/cacheClient", () => ({
      getClient: jest.fn(async () => null),
      conectar: jest.fn(async () => null),
      estaConectado: jest.fn(() => false),
    }));

    const { app: app2 } = require("../src/infrastructure/http/server");
    const request2 = require("supertest");

    const res = await request2(app2)
      .get("/api/busqueda/productos?q=sinredis")
      .expect(200);

    expect(res.headers["x-cache"]).toBe("MISS");
    expect(res.body).toBeDefined();
  });
});

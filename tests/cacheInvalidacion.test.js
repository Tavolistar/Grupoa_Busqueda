const { invalidarCachePorProducto } = require("../src/infrastructure/cache/cacheBusqueda");

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
    sMembers: jest.fn(async (key) => {
      if (!sets.has(key)) return [];
      return Array.from(sets.get(key));
    }),
    expire: jest.fn(async () => 1),
    del: jest.fn(async (key) => {
      let deleted = 0;
      if (store.has(key)) {
        store.delete(key);
        deleted++;
      }
      if (sets.has(key)) {
        sets.delete(key);
        deleted++;
      }
      return deleted;
    }),
    multi: jest.fn(() => {
      const ops = [];
      const chain = {
        sAdd: function (k, m) {
          if (!sets.has(k)) sets.set(k, new Set());
          sets.get(k).add(m);
          ops.push({ type: "sAdd" });
          return this;
        },
        expire: function () {
          ops.push({ type: "expire" });
          return this;
        },
        del: function (k) {
          ops.push({ type: "del", key: k });
          return this;
        },
        exec: async function () {
          for (const op of ops) {
            if (op.type === "del" && op.key) {
              store.delete(op.key);
              sets.delete(op.key);
            }
          }
          return ops.map(() => [null, 1]);
        },
      };
      return chain;
    }),
  };
  return {
    getClient: jest.fn(async () => client),
    conectar: jest.fn(async () => client),
    estaConectado: jest.fn(() => true),
  };
});

jest.mock("../src/application/buscarProductos", () => {
  return {
    buscarProductos: jest.fn(async (params) => {
      if (params && params.q === "A") {
        return { productos: [{ id: "A1", nombre: "Prod A" }], total: 1 };
      }
      if (params && params.q === "B") {
        return { productos: [{ id: "B1", nombre: "Prod B" }], total: 1 };
      }
      return { productos: [], total: 0 };
    }),
  };
});

jest.mock("amqplib", () => {
  const assertQueueMock = jest.fn(async () => ({ queue: "busqueda.catalogo.eventos" }));
  const assertExchangeMock = jest.fn(async () => ({}));
  const bindQueueMock = jest.fn(async () => ({}));
  const consumeMock = jest.fn(async () => ({}));
  const ackMock = jest.fn();
  const nackMock = jest.fn();
  const channel = {
    assertExchange: assertExchangeMock,
    assertQueue: assertQueueMock,
    bindQueue: bindQueueMock,
    consume: consumeMock,
    ack: ackMock,
    nack: nackMock,
  };
  return {
    connect: jest.fn(async () => ({
      createChannel: jest.fn(async () => channel),
    })),
    __mocks: {
      assertQueueMock,
      assertExchangeMock,
      bindQueueMock,
      channel,
    },
  };
});

jest.mock("../src/infrastructure/elasticsearch/client", () => ({
  update: jest.fn(async () => ({})),
}));

describe("Invalidación de caché por evento y DLQ", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Al invalidar producto A, su búsqueda queda en MISS y la de producto B se mantiene en HIT", async () => {
    const { app } = require("../src/infrastructure/http/server");
    const request = require("supertest");

    // Primera consulta A - MISS y se guarda con A1
    await request(app).get("/api/busqueda/productos?q=A").expect(200);
    // Primera consulta B - MISS y se guarda con B1
    await request(app).get("/api/busqueda/productos?q=B").expect(200);

    // Segunda consulta A debe ser HIT
    let resA = await request(app).get("/api/busqueda/productos?q=A").expect(200);
    expect(resA.headers["x-cache"]).toBe("HIT");
    // Segunda consulta B debe ser HIT
    let resB = await request(app).get("/api/busqueda/productos?q=B").expect(200);
    expect(resB.headers["x-cache"]).toBe("HIT");

    // Invalidar solo A1
    await invalidarCachePorProducto("A1");

    // Después de invalidar, A debe ser MISS, B debe seguir HIT
    resA = await request(app).get("/api/busqueda/productos?q=A").expect(200);
    expect(resA.headers["x-cache"]).toBe("MISS");
    resB = await request(app).get("/api/busqueda/productos?q=B").expect(200);
    expect(resB.headers["x-cache"]).toBe("HIT");
  });

  test("Consumidor de RabbitMQ llama a invalidación al procesar evento", async () => {
    jest.resetModules();
    const amqp = require("amqplib");
    const invalidarCachePorProductoMock = jest.fn(async () => true);
    jest.doMock("../src/infrastructure/cache/cacheBusqueda", () => ({
      invalidarCachePorProducto: invalidarCachePorProductoMock,
    }));
    jest.doMock("../src/infrastructure/elasticsearch/client", () => ({
      update: jest.fn(async () => ({})),
    }));

    const { iniciarConsumidor } = require("../src/infrastructure/rabbitmq/catalogoConsumer");
    await iniciarConsumidor();

    const consumeCall = amqp.__mocks.channel.consume.mock.calls[0];
    expect(consumeCall).toBeDefined();
    const callback = consumeCall[1];

    const msg = {
      content: Buffer.from(JSON.stringify({ id: "P123", nombre: "Test" })),
      fields: { routingKey: "catalogo.producto.actualizado" },
    };

    await callback(msg);
    expect(invalidarCachePorProductoMock).toHaveBeenCalledWith("P123");
  });

  test("Cola principal configura parámetros DLQ", async () => {
    jest.resetModules();
    const amqp = require("amqplib");
    jest.doMock("../src/infrastructure/cache/cacheBusqueda", () => ({
      invalidarCachePorProducto: jest.fn(async () => true),
    }));
    jest.doMock("../src/infrastructure/elasticsearch/client", () => ({
      update: jest.fn(async () => ({})),
    }));

    const { iniciarConsumidor } = require("../src/infrastructure/rabbitmq/catalogoConsumer");
    await iniciarConsumidor();

    const assertQueueCalls = amqp.__mocks.assertQueueMock.mock.calls;
    const principalCall = assertQueueCalls.find((c) => c[0] === "busqueda.catalogo.eventos");
    expect(principalCall).toBeDefined();
    expect(principalCall[1]).toBeDefined();
    expect(principalCall[1].arguments).toBeDefined();
    expect(principalCall[1].arguments["x-dead-letter-exchange"]).toBe("busqueda.dlx");
    expect(principalCall[1].arguments["x-dead-letter-routing-key"]).toBe("busqueda.dlq.key");
  });
});

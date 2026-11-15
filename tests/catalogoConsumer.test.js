// Contrato de Catálogo, sección 5: exchange, routing keys y el campo "activo" de cada evento.
const {
  documentoDeProducto,
  EXCHANGE,
  ROUTING_KEYS,
} = require("../src/infrastructure/rabbitmq/catalogoConsumer");

const camiseta = {
  id: "674000000000000000000001",
  nombre: "Camiseta básica algodón",
  descripcion: "Camiseta unisex 100% algodón.",
  precio: 49900,
  categoria: "cat-ropa",
  stock: 100,
  activo: true,
  fecha: "2026-11-13T15:30:00Z",
};

describe("consumidor de eventos de Catálogo", () => {
  test("escucha el exchange del contrato", () => {
    expect(EXCHANGE).toBe("catalogo.eventos");
  });

  test("se enlaza a las cuatro routing keys del contrato", () => {
    expect(Object.keys(ROUTING_KEYS).sort()).toEqual([
      "producto.actualizado",
      "producto.creado",
      "producto.desactivado",
      "producto.reactivado",
    ]);
  });

  test("un producto activo queda activo", () => {
    expect(documentoDeProducto(camiseta).activo).toBe(true);
  });

  test("un producto desactivado que se edita sigue fuera de la búsqueda", () => {
    expect(documentoDeProducto({ ...camiseta, activo: false }).activo).toBe(false);
  });

  test("guarda todos los campos del evento y la sugerencia", () => {
    const doc = documentoDeProducto(camiseta, new Date("2026-11-13T16:00:00Z"));
    expect(doc).toMatchObject({ stock: 100, descripcion: camiseta.descripcion, precio: 49900 });
    expect(doc.actualizadoEn).toBe("2026-11-13T16:00:00.000Z");
    expect(doc.sugerencia.input).toEqual(["Camiseta básica algodón", "Camiseta", "básica", "algodón"]);
  });
});

describe("caché al recibir eventos", () => {
  beforeEach(() => jest.resetModules());

  async function procesar(routingKey, payload) {
    const invalidarCachePorProducto = jest.fn(async () => true);
    const invalidarTodaLaBusqueda = jest.fn(async () => true);
    let alConsumir;
    const canal = {
      assertExchange: jest.fn(async () => ({})),
      assertQueue: jest.fn(async () => ({})),
      bindQueue: jest.fn(async () => ({})),
      prefetch: jest.fn(async () => ({})),
      consume: jest.fn(async (cola, fn) => { alConsumir = fn; }),
      ack: jest.fn(),
      nack: jest.fn(),
    };
    const update = jest.fn(async () => ({}));
    jest.doMock("amqplib", () => ({ connect: async () => ({ createChannel: async () => canal }) }));
    jest.doMock("../src/infrastructure/elasticsearch/client", () => ({ update }));
    jest.doMock("../src/infrastructure/cache/cacheBusqueda", () => ({ invalidarCachePorProducto, invalidarTodaLaBusqueda }));
    const { iniciarConsumidor } = require("../src/infrastructure/rabbitmq/catalogoConsumer");
    await iniciarConsumidor();
    await alConsumir({ content: Buffer.from(JSON.stringify(payload)), fields: { routingKey } });
    expect(canal.ack).toHaveBeenCalled();
    return { invalidarCachePorProducto, invalidarTodaLaBusqueda, canal, update };
  }

  test("procesa un evento a la vez para conservar el orden de cada producto", async () => {
    const { canal } = await procesar("producto.actualizado", camiseta);
    expect(canal.prefetch).toHaveBeenCalledWith(1);
  });

  test("el cambio queda visible antes de borrar la caché y reintenta conflictos de versión", async () => {
    const { update } = await procesar("producto.reactivado", camiseta);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ refresh: true, retry_on_conflict: 3 }));
  });

  test("un producto reactivado borra todas las búsquedas guardadas", async () => {
    const { invalidarTodaLaBusqueda } = await procesar("producto.reactivado", camiseta);
    expect(invalidarTodaLaBusqueda).toHaveBeenCalled();
  });

  test("un producto creado borra todas las búsquedas guardadas", async () => {
    const { invalidarTodaLaBusqueda } = await procesar("producto.creado", camiseta);
    expect(invalidarTodaLaBusqueda).toHaveBeenCalled();
  });

  test("un producto actualizado solo borra las búsquedas donde aparecía", async () => {
    const r = await procesar("producto.actualizado", camiseta);
    expect(r.invalidarCachePorProducto).toHaveBeenCalledWith(camiseta.id);
    expect(r.invalidarTodaLaBusqueda).not.toHaveBeenCalled();
  });
});

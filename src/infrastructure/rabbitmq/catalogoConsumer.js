const amqp = require("amqplib");
const esClient = require("../elasticsearch/client");
const { invalidarCachePorProducto, invalidarTodaLaBusqueda } = require("../../infrastructure/cache/cacheBusqueda");
 
// Exchange y routing keys del contrato de Catálogo (sección 5).
const EXCHANGE = "catalogo.eventos";
const EXCHANGE_TYPE = "topic";
const QUEUE = "busqueda.catalogo.eventos";
const ROUTING_KEYS = {
  "producto.creado": "ProductoCreado",
  "producto.actualizado": "ProductoActualizado",
  "producto.desactivado": "ProductoDesactivado",
  "producto.reactivado": "ProductoReactivado",
};

// El documento que se guarda en Elasticsearch para un evento con el producto completo
// (creado, actualizado y reactivado). El estado sale del evento: un producto desactivado que se
// edita publica "producto.actualizado" con activo: false y no debe volver a la búsqueda.
function documentoDeProducto(payload, ahora = new Date()) {
  return {
    ...payload,
    activo: payload.activo !== false,
    actualizadoEn: ahora.toISOString(),
    sugerencia: {
      input: [payload.nombre, ...String(payload.nombre || "").split(/\s+/).filter(Boolean)],
    },
  };
}

const DLX_EXCHANGE = "busqueda.dlx";
const DLX_ROUTING_KEY = "busqueda.dlq.key";
const DLQ_QUEUE = "busqueda.catalogo.events.dlq";
 
async function iniciarConsumidor() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });
  await channel.assertQueue(DLQ_QUEUE, { durable: true });
  await channel.bindQueue(DLQ_QUEUE, DLX_EXCHANGE, DLX_ROUTING_KEY);

  await channel.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": DLX_EXCHANGE,
      "x-dead-letter-routing-key": DLX_ROUTING_KEY,
    },
  });
  for (const routingKey of Object.keys(ROUTING_KEYS)) {
    await channel.bindQueue(QUEUE, EXCHANGE, routingKey);
  }
 
  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    const tipoEvento = ROUTING_KEYS[msg.fields.routingKey];
    const payload = JSON.parse(msg.content.toString()); // payload plano, sin envoltorio "tipo"
    try {
      switch (tipoEvento) {
        case "ProductoCreado":
        case "ProductoActualizado":
        case "ProductoReactivado":
          await esClient.update({
            index: "productos", id: payload.id,
            doc: documentoDeProducto(payload),
            doc_as_upsert: true,
          });
          if (tipoEvento === "ProductoActualizado") {
            await invalidarCachePorProducto(payload.id);
          } else {
            await invalidarTodaLaBusqueda();
          }
          break;
        case "ProductoDesactivado":
          await esClient.update({
            index: "productos", id: payload.id,
            doc: { activo: false, actualizadoEn: new Date().toISOString() },
          });
          if (payload.id) {
            await invalidarCachePorProducto(payload.id);
          }
          break;
        default:
          console.warn("Routing key no reconocida:", msg.fields.routingKey);
      }
      channel.ack(msg);
    } catch (err) {
      console.error("Error procesando evento de Catálogo:", err);
      channel.nack(msg, false, false); // a dead-letter si se configura
    }
  });
}
module.exports = { iniciarConsumidor, documentoDeProducto, EXCHANGE, ROUTING_KEYS };

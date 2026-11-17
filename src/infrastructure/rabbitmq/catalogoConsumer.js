const amqp = require("amqplib");
const esClient = require("../elasticsearch/client");
const { invalidarCachePorProducto } = require("../../infrastructure/cache/cacheBusqueda");
 
// Decidido en la reunión de planificación del Sprint 1:
const EXCHANGE = "catalogo.events";
const EXCHANGE_TYPE = "topic";
const QUEUE = "busqueda.catalogo.eventos";
const ROUTING_KEYS = {
  "catalogo.producto.creado": "ProductoCreado",
  "catalogo.producto.actualizado": "ProductoActualizado",
  "catalogo.producto.reactivado": "ProductoReactivado",
  "catalogo.producto.desactivado": "ProductoDesactivado",
};

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
        case "ProductoReactivado": {
          // id, nombre, precio, categoria confirmados. descripcion/stock aún no llegan.
          // `imagenes` (Catalogo v2.6) es un arreglo de strings: se conserva íntegro
          // tal como llega en el payload. Si no viene, no se incluye y no rompe nada.
          const doc = {
            ...payload,
            activo: true,
            actualizadoEn: new Date().toISOString(),
            sugerencia: {
              input: [payload.nombre, ...String(payload.nombre || "").split(/\s+/).filter(Boolean)],
            },
          };
          if (!Array.isArray(payload.imagenes)) {
            delete doc.imagenes;
          }
          await esClient.update({
            index: "productos",
            id: payload.id,
            doc,
            doc_as_upsert: true,
          });
          if (payload.id) {
            await invalidarCachePorProducto(payload.id);
          }
          break;
        }
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
module.exports = { iniciarConsumidor };

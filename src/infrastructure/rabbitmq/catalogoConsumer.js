const amqp = require("amqplib");
const esClient = require("../elasticsearch/client");
 
// Decidido en la reunión de planificación del Sprint 1:
const EXCHANGE = "catalogo.events";
const EXCHANGE_TYPE = "topic";
const QUEUE = "busqueda.catalogo.eventos";
const ROUTING_KEYS = {
  "catalogo.producto.creado": "ProductoCreado",
  "catalogo.producto.actualizado": "ProductoActualizado",
  "catalogo.producto.desactivado": "ProductoDesactivado",
};
 
async function iniciarConsumidor() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
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
          // id, nombre, precio, categoria confirmados. descripcion/stock aún no llegan
          // (quedan sin tocar en el índice hasta que Catálogo los agregue al evento).
          await esClient.update({
            index: "productos", id: payload.id,
            doc: {
              ...payload,
              activo: true,
              actualizadoEn: new Date().toISOString(),
              sugerencia: {
                input: [payload.nombre, ...String(payload.nombre || "").split(/\s+/).filter(Boolean)],
              },
            },
            doc_as_upsert: true,
          });
          break;
        case "ProductoDesactivado":
          await esClient.update({
            index: "productos", id: payload.id,
            doc: { activo: false, actualizadoEn: new Date().toISOString() },
          });
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

// Simula al microservicio de Catálogo publicando un evento en RabbitMQ.
// Uso:
//   node scripts/publicarEventoCatalogo.js creado      p100 "Bufanda de lana" 45000 cat-accesorios
//   node scripts/publicarEventoCatalogo.js actualizado p100 "Bufanda de lana gris" 39000 cat-accesorios
//   node scripts/publicarEventoCatalogo.js desactivado p100
const amqp = require("amqplib");
require("dotenv").config();

// Mismo exchange y routing keys que escucha src/infrastructure/rabbitmq/catalogoConsumer.js
const EXCHANGE = "catalogo.events";
const TIPOS = {
  creado: "catalogo.producto.creado",
  actualizado: "catalogo.producto.actualizado",
  desactivado: "catalogo.producto.desactivado",
};

async function publicarEvento(tipo, payload, url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672") {
  const routingKey = TIPOS[tipo];
  if (!routingKey) throw new Error(`Tipo de evento desconocido: ${tipo} (usa creado, actualizado o desactivado)`);
  const conn = await amqp.connect(url);
  try {
    const channel = await conn.createConfirmChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
      contentType: "application/json",
      persistent: true,
    });
    await channel.waitForConfirms();
  } finally {
    await conn.close();
  }
  return routingKey;
}

if (require.main === module) {
  const [tipo, id, nombre, precio, categoria] = process.argv.slice(2);
  if (!tipo || !id) {
    console.error('Uso: node scripts/publicarEventoCatalogo.js <creado|actualizado|desactivado> <id> ["nombre"] [precio] [categoria]');
    process.exit(1);
  }
  const payload = tipo === "desactivado" ? { id } : { id, nombre, precio: Number(precio), categoria };
  publicarEvento(tipo, payload)
    .then((rk) => console.log(`Evento publicado: ${rk}`, payload))
    .catch((err) => {
      console.error("No se pudo publicar el evento:", err.message);
      process.exit(1);
    });
}

module.exports = { publicarEvento };

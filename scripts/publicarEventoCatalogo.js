// Simula al microservicio de Catálogo publicando un evento en RabbitMQ (contrato de Catálogo, sección 5).
// Uso:
//   node scripts/publicarEventoCatalogo.js creado      p100 "Bufanda de lana" 45000 cat-accesorios 10
//   node scripts/publicarEventoCatalogo.js actualizado p100 "Bufanda de lana gris" 39000 cat-accesorios 9
//   node scripts/publicarEventoCatalogo.js desactivado p100
//   node scripts/publicarEventoCatalogo.js reactivado  p100 "Bufanda de lana gris" 39000 cat-accesorios 9
const amqp = require("amqplib");
require("dotenv").config();

// Mismo exchange y routing keys que escucha src/infrastructure/rabbitmq/catalogoConsumer.js
const EXCHANGE = "catalogo.eventos";
const TIPOS = {
  creado: "producto.creado",
  actualizado: "producto.actualizado",
  desactivado: "producto.desactivado",
  reactivado: "producto.reactivado",
};

async function publicarEvento(tipo, payload, url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672") {
  const routingKey = TIPOS[tipo];
  if (!routingKey) throw new Error(`Tipo de evento desconocido: ${tipo} (usa ${Object.keys(TIPOS).join(", ")})`);
  const conn = await amqp.connect(url);
  try {
    const channel = await conn.createConfirmChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    // El cuerpo es el JSON plano, sin envoltorio, con la fecha del evento
    const cuerpo = { ...payload, fecha: new Date().toISOString() };
    channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(cuerpo)), {
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
  const [tipo, id, nombre, precio, categoria, stock] = process.argv.slice(2);
  if (!tipo || !id) {
    console.error('Uso: node scripts/publicarEventoCatalogo.js <creado|actualizado|desactivado|reactivado> <id> ["nombre"] [precio] [categoria] [stock]');
    process.exit(1);
  }
  const payload = tipo === "desactivado"
    ? { id }
    : { id, nombre, descripcion: nombre, precio: Number(precio), categoria, stock: Number(stock || 0), activo: true };
  publicarEvento(tipo, payload)
    .then((rk) => console.log(`Evento publicado: ${rk}`, payload))
    .catch((err) => {
      console.error("No se pudo publicar el evento:", err.message);
      process.exit(1);
    });
}

module.exports = { publicarEvento };

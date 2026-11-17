const esClient = require("./infrastructure/elasticsearch/client");
const { crearIndiceSiNoExiste } = require("./infrastructure/elasticsearch/productoIndex");
const { iniciarConsumidor } = require("./infrastructure/rabbitmq/catalogoConsumer");
const { iniciarServidor } = require("./infrastructure/http/server");
const { registrarEnEureka } = require("./infrastructure/eureka/registroEureka");

let registroEureka = null;

async function iniciar() {
  await crearIndiceSiNoExiste(esClient);
  console.log("Índice listo ✅");
  await iniciarConsumidor();
  console.log("Escuchando eventos de Catálogo 👂");
  iniciarServidor();

  registroEureka = registrarEnEureka({
    app: "busqueda",
    puerto: process.env.PORT || 3000,
    rutaSalud: "/api/busqueda/productos",
    comprobarSalud: () => esClient.ping().then(() => true, () => false),
  });
  if (registroEureka) {
    console.log(`Registrado en Eureka como ${registroEureka.instanceId} 🌐`);
  }
}

async function detener(senal) {
  console.log(`Recibida ${senal}, deteniendo el servicio...`);
  if (registroEureka) {
    await registroEureka.detener();
  }
  process.exit(0);
}

process.on("SIGTERM", () => detener("SIGTERM"));
process.on("SIGINT", () => detener("SIGINT"));

iniciar().catch((err) => {
  console.error("Error iniciando el microservicio de búsqueda:", err);
  process.exit(1);
});
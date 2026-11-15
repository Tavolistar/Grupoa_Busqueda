const esClient = require("./infrastructure/elasticsearch/client");
const { crearIndiceSiNoExiste } = require("./infrastructure/elasticsearch/productoIndex");
const { iniciarConsumidor } = require("./infrastructure/rabbitmq/catalogoConsumer");
const { iniciarServidor } = require("./infrastructure/http/server");
const { registrarEnEureka } = require("./infrastructure/eureka/registroEureka");
 
async function iniciar() {
  await crearIndiceSiNoExiste(esClient);
  console.log("Índice listo ✅");
  await iniciarConsumidor();
  console.log("Escuchando eventos de Catálogo 👂");
  iniciarServidor();

  // Se anuncia en Eureka (solo si EUREKA_URL está definida). Está UP mientras responda Elasticsearch.
  const registro = registrarEnEureka({
    app: "busqueda",
    puerto: process.env.PORT || 3000,
    rutaSalud: "/api/busqueda/productos",
    comprobarSalud: () => esClient.ping().then(() => true, () => false),
  });
  if (registro) {
    // Al apagarse se despide de Eureka, para que salga de la lista enseguida.
    for (const senal of ["SIGTERM", "SIGINT"]) {
      process.once(senal, async () => {
        await registro.detener();
        process.exit(0);
      });
    }
  }
}
 
iniciar();

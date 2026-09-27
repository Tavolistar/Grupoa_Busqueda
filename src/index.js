// src/index.js
const esClient = require("./infrastructure/elasticsearch/client");
const { crearIndiceSiNoExiste } = require("./infrastructure/elasticsearch/productoIndex");
const { iniciarConsumidor } = require("./infrastructure/rabbitmq/catalogoConsumer");

async function iniciar() {
  await crearIndiceSiNoExiste(esClient);
  console.log("Índice listo ✅");

  await iniciarConsumidor();
  console.log("Escuchando eventos de Catálogo 👂");
}

iniciar();
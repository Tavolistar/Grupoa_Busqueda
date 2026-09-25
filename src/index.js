const esClient = require("./infrastructure/elasticsearch/client");
const { crearIndiceSiNoExiste } = require("./infrastructure/elasticsearch/productoIndex");

async function iniciar() {
  await crearIndiceSiNoExiste(esClient);
  console.log("Índice listo ✅");
}

iniciar();
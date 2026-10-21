const esClient = require("../src/infrastructure/elasticsearch/client");
const { settings, mappings } = require("../src/infrastructure/elasticsearch/productoIndex");

async function inicializarIndice() {
  try {
    await esClient.indices.create({ index: "productos_v2", settings, mappings });
    await esClient.indices.putAlias({ index: "productos_v2", name: "productos" });
    console.log("Índice productos_v2 creado y alias productos asignado correctamente.");
  } catch (error) {
    console.error("Error inicializando el índice:", error.message);
  }
}
inicializarIndice();

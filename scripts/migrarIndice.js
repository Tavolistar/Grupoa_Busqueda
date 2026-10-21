const esClient = require("../src/infrastructure/elasticsearch/client");
const { settings, mappings } = require("../src/infrastructure/elasticsearch/productoIndex");

async function migrarIndice() {
  try {
    const source = "productos";
    const target = "productos_v2";

    // Crear índice destino
    const existsTarget = await esClient.indices.exists({ index: target });
    if (existsTarget) {
      await esClient.indices.delete({ index: target });
    }
    await esClient.indices.create({
      index: target,
      body: { settings, mappings },
    });

    // Reindexar
    await esClient.reindex({
      body: {
        source: { index: source },
        dest: { index: target },
      },
      refresh: true,
    });

    // Eliminar índice anterior y crear alias
    const existsSource = await esClient.indices.exists({ index: source });
    if (existsSource) {
      await esClient.indices.delete({ index: source });
    }
    await esClient.indices.putAlias({ index: target, name: source });

    console.log("Migración completada: productos -> productos_v2 con alias productos");
  } catch (err) {
    console.error("Error en migración:", err.message);
    process.exit(1);
  }
}

migrarIndice();

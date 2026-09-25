const mapping = {
  mappings: {
    properties: {
      id:            { type: "keyword" },
      nombre:        { type: "text", analyzer: "spanish",
                       fields: { keyword: { type: "keyword" } } },
      descripcion:   { type: "text", analyzer: "spanish" },
      categoria:     { type: "keyword" },
      precio:        { type: "float" },
      stock:         { type: "integer" },
      imagenes:      { type: "keyword" },   // 👈 la nueva, array de URLs
      activo:        { type: "boolean" },
      actualizadoEn: { type: "date" },
      sugerencia:    { type: "completion" }
    }
  }
};

async function crearIndiceSiNoExiste(esClient) {
  const existe = await esClient.indices.exists({ index: "productos" });
  if (!existe) await esClient.indices.create({ index: "productos", body: mapping });
}
module.exports = { crearIndiceSiNoExiste };
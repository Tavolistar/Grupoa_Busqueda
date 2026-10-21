const { SINONIMOS } = require("./sinonimos");

const settings = {
  analysis: {
    filter: {
      sinonimos_es: {
        type: "synonym_graph",
        synonyms: SINONIMOS,
      },
      spanish_stop: {
        type: "stop",
        stopwords: "_spanish_",
      },
      spanish_stemmer: {
        type: "stemmer",
        language: "light_spanish",
      },
    },
    analyzer: {
      busqueda_sinonimos: {
        type: "custom",
        tokenizer: "standard",
        filter: ["lowercase", "sinonimos_es", "spanish_stop", "spanish_stemmer"],
      },
    },
  },
};

const mappings = {
  properties: {
    nombre: {
      type: "text",
      analyzer: "spanish",
      search_analyzer: "busqueda_sinonimos",
      fields: {
        keyword: { type: "keyword" },
      },
    },
    descripcion: {
      type: "text",
      analyzer: "spanish",
      search_analyzer: "busqueda_sinonimos",
    },
    id: { type: "keyword" },
    categoria: { type: "keyword" },
    precio: { type: "float" },
    stock: { type: "integer" },
    activo: { type: "boolean" },
    actualizadoEn: { type: "date" },
    sugerencia: { type: "completion" },
  },
};

module.exports = { settings, mappings };

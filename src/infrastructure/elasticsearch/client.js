const { Client } = require("@elastic/elasticsearch");
require("dotenv").config();

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

module.exports = esClient;
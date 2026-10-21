// scripts/seed.js  ->  npm run seed   (o: npm run seed -- --reset para recrear el índice)
require("dotenv").config();
const esClient = require("../src/infrastructure/elasticsearch/client");
const { crearIndiceSiNoExiste } = require("../src/infrastructure/elasticsearch/productoIndex");

const productos = [
  { id: "p1",  nombre: "Camisa azul",                 descripcion: "Camisa de algodón manga larga", categoria: "cat-ropa",       precio: 50000 },
  { id: "p2",  nombre: "Zapatos deportivos Nike Air", descripcion: "Zapatos para correr con amortiguación", categoria: "cat-zapatos", precio: 250000 },
  { id: "p3",  nombre: "Zapatillas Adidas",           descripcion: "Zapatillas urbanas livianas", categoria: "cat-zapatos",    precio: 180000 },
  { id: "p4",  nombre: "Camiseta blanca basica",      descripcion: "Camiseta de algodón cuello redondo", categoria: "cat-ropa",  precio: 35000 },
  { id: "p5",  nombre: "Pantalon jean clasico",       descripcion: "Jean azul corte recto", categoria: "cat-ropa",             precio: 120000 },
  { id: "p6",  nombre: "Tenis running Puma",          descripcion: "Tenis para trote diario", categoria: "cat-zapatos",        precio: 300000 },
  { id: "p7",  nombre: "Mochila escolar",             descripcion: "Mochila con varios compartimentos", categoria: "cat-accesorios", precio: 90000 },
  { id: "p8",  nombre: "Gorra negra",                 descripcion: "Gorra ajustable", categoria: "cat-accesorios",             precio: 30000 },
  { id: "p9",  nombre: "Chaqueta impermeable",        descripcion: "Chaqueta ligera para lluvia", categoria: "cat-ropa",       precio: 200000 },
  { id: "p10", nombre: "Sandalias de cuero",          descripcion: "Sandalias artesanales", categoria: "cat-zapatos",          precio: 95000, activo: false },
];

async function seed() {
  if (process.argv.includes("--reset")) {
    await esClient.indices.delete({ index: "productos" }, { ignore: [404] });
    console.log("Índice eliminado");
  }
  await crearIndiceSiNoExiste(esClient);

  const ahora = new Date().toISOString();
  const operations = productos.flatMap(({ id, ...doc }) => [
    { index: { _index: "productos", _id: id } },
    { id, imagenes: [], activo: true, ...doc, actualizadoEn: ahora,
      sugerencia: { input: [doc.nombre, ...doc.nombre.split(" ")] } },
  ]);

  const res = await esClient.bulk({ operations, refresh: true });
  if (res.errors) {
    console.error("Hubo errores al cargar:", JSON.stringify(res.items.filter((i) => i.index.error), null, 2));
    process.exit(1);
  }
  console.log(`Seed OK: ${productos.length} productos cargados (p10 desactivado)`);
}

seed().catch((e) => { console.error(e); process.exit(1); });

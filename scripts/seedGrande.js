const esClient = require("../src/infrastructure/elasticsearch/client");

const TOTAL = Number(process.argv[2]) || 10000;
const CATEGORIAS = ["cat-ropa", "cat-zapatos", "cat-accesorios"];
const NOMBRES = [
  "Camisa",
  "Camiseta",
  "Pantalon",
  "Zapatos",
  "Tenis",
  "Gorra",
  "Chaqueta",
  "Mochila",
  "Sandalias",
  "Vestido",
];

function generarProductos() {
  const productos = [];
  for (let i = 1; i <= TOTAL; i++) {
    const cat = CATEGORIAS[i % CATEGORIAS.length];
    const base = NOMBRES[i % NOMBRES.length];
    const nombre = `${base} ${i}`;
    productos.push({
      id: `pg${i}`,
      nombre,
      descripcion: `${nombre} de prueba para pruebas de carga`,
      categoria: cat,
      precio: Math.round((10000 + (i % 90) * 5000) / 100) * 100,
      activo: i % 50 !== 0,
      actualizadoEn: new Date().toISOString(),
      sugerencia: { input: [nombre, base] },
    });
  }
  return productos;
}

async function seedGrande() {
  const productos = generarProductos();
  const CHUNK = 1000;
  try {
    for (let i = 0; i < productos.length; i += CHUNK) {
      const body = [];
      for (const p of productos.slice(i, i + CHUNK)) {
        body.push({ index: { _index: "productos", _id: p.id } });
        body.push(p);
      }
      await esClient.bulk({ refresh: false, body });
      console.log(`  ... ${Math.min(i + CHUNK, productos.length)}/${productos.length}`);
    }
    await esClient.indices.refresh({ index: "productos" });
    console.log(`Seed grande completado: ${productos.length} productos`);
  } catch (err) {
    console.error("Error en seed grande:", err.message);
    process.exit(1);
  }
}

seedGrande();

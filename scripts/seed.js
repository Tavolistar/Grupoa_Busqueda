const esClient = require("../src/infrastructure/elasticsearch/client");

const productos = [
  { id: "p1", nombre: "Camisa azul", categoria: "cat-ropa", precio: 50000 },
  { id: "p2", nombre: "Zapatos deportivos Nike Air", categoria: "cat-zapatos", precio: 250000 },
  { id: "p3", nombre: "Zapatillas Adidas", categoria: "cat-zapatos", precio: 180000 },
  { id: "p4", nombre: "Camiseta blanca basica", categoria: "cat-ropa", precio: 35000 },
  { id: "p5", nombre: "Pantalon jean clasico", categoria: "cat-ropa", precio: 120000 },
  { id: "p6", nombre: "Tenis running Puma", categoria: "cat-zapatos", precio: 300000 },
  { id: "p7", nombre: "Mochila escolar", categoria: "cat-accesorios", precio: 90000 },
  { id: "p8", nombre: "Gorra negra", categoria: "cat-accesorios", precio: 30000 },
  { id: "p9", nombre: "Chaqueta impermeable", categoria: "cat-ropa", precio: 200000 },
  { id: "p10", nombre: "Sandalias de cuero", categoria: "cat-zapatos", precio: 95000, activo: false },
];

async function seed() {
  try {
    const body = [];
    for (const p of productos) {
      body.push({ index: { _index: "productos", _id: p.id } });
      body.push({
        nombre: p.nombre,
        categoria: p.categoria,
        precio: p.precio,
        activo: p.activo ?? true,
        actualizadoEn: new Date().toISOString(),
        sugerencia: { input: [p.nombre, p.nombre.split(" ")[0]] },
      });
    }
    const resp = await esClient.bulk({ refresh: true, body });
    console.log("Seed completado", resp?.items?.length || body.length / 2);
  } catch (err) {
    console.error("Error en seed:", err.message);
    process.exit(1);
  }
}

seed();

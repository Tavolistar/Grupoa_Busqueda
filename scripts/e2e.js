// Prueba end-to-end del Sprint 4: Catálogo (simulado) -> RabbitMQ -> índice -> caché -> Kong.
// Requiere: docker compose --profile gateway up -d --build
// Uso: node scripts/e2e.js            (por defecto contra Kong en http://localhost:8000)
//      BASE_URL=http://localhost:3000 node scripts/e2e.js
const { publicarEvento } = require("./publicarEventoCatalogo");

const BASE = (process.env.BASE_URL || "http://localhost:8000") + "/api/busqueda";
const ID = "e2e-1";
// Tamaño de página propio de esta corrida: así no se lee una respuesta que una corrida anterior dejó en caché
// (una búsqueda cacheada sin el producto no se invalida cuando el producto se crea; vence a los 5 minutos)
const TP = 51 + (Date.now() % 49);
const resultados = [];

async function get(path) {
  const res = await fetch(BASE + path);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, body };
}

const ids = (r) => (r.body.productos || []).map((p) => p.id);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Reintenta hasta que la condición se cumpla; el índice se actualiza de forma asíncrona
async function hastaQue(fn, intentos = 20) {
  for (let i = 0; i < intentos; i++) {
    const r = await fn(i);
    if (r) return r;
    await esperar(500);
  }
  return null;
}

function revisar(nombre, ok, detalle) {
  resultados.push({ prueba: nombre, resultado: ok ? "PASA" : "FALLA", detalle });
}

async function main() {
  console.log(`Prueba end-to-end contra ${BASE}\n`);

  const base = await get("/productos?q=camisa");
  revisar("Kong enruta la búsqueda", base.status === 200 && base.headers.get("x-request-id") !== null,
    `HTTP ${base.status}, X-Request-Id: ${base.headers.get("x-request-id") ? "sí" : "no"}`);

  const sug = await get("/sugerencias?q=cam");
  revisar("Kong enruta las sugerencias", sug.status === 200 && (sug.body.sugerencias || []).length > 0,
    `HTTP ${sug.status}, ${(sug.body.sugerencias || []).length} sugerencias`);

  const limite = await get("/productos?q=camisa&pagina=600&tamanoPagina=20");
  revisar("Validación de paginación a través de Kong", limite.status === 400, `HTTP ${limite.status}`);

  // 1. Catálogo crea un producto. Cada intento usa un tamaño de página distinto para no leer una respuesta cacheada
  await publicarEvento("creado", { id: ID, nombre: "Bufanda andina", precio: 45000, categoria: "cat-accesorios" });
  const creado = await hastaQue((i) => get(`/productos?q=bufanda&tamanoPagina=${TP - 40 + i}`).then((r) => ids(r).includes(ID) && r));
  revisar("ProductoCreado aparece en la búsqueda", !!creado, creado ? "indexado desde el evento" : "no apareció en 10 s");

  // 2. La misma consulta dos veces queda en caché
  await get(`/productos?q=bufanda&tamanoPagina=${TP}`);
  const cache = await get(`/productos?q=bufanda&tamanoPagina=${TP}`);
  revisar("La consulta repetida sale de la caché", cache.headers.get("x-cache") === "HIT", `X-Cache: ${cache.headers.get("x-cache")}`);

  // 3. Catálogo actualiza el producto: la búsqueda cacheada que lo contiene se invalida
  await publicarEvento("actualizado", { id: ID, nombre: "Bufanda andina gris", precio: 39000, categoria: "cat-accesorios" });
  const actualizado = await hastaQue(() => get(`/productos?q=bufanda&tamanoPagina=${TP}`).then((r) => {
    const p = (r.body.productos || []).find((x) => x.id === ID);
    return p && p.precio === 39000 && r;
  }));
  revisar("ProductoActualizado invalida la caché y muestra el precio nuevo", !!actualizado && actualizado.headers.get("x-cache") === "MISS",
    actualizado ? `X-Cache: ${actualizado.headers.get("x-cache")}, precio 39000` : "seguía el precio anterior");

  // 4. Catálogo desactiva el producto: deja de aparecer
  await publicarEvento("desactivado", { id: ID });
  const desactivado = await hastaQue(() => get(`/productos?q=bufanda&tamanoPagina=${TP}`).then((r) => !ids(r).includes(ID) && r));
  revisar("ProductoDesactivado deja de aparecer", !!desactivado, desactivado ? "ya no está en los resultados" : "seguía apareciendo");

  console.table(resultados);
  const fallas = resultados.filter((r) => r.resultado === "FALLA").length;
  console.log(fallas ? `\n${fallas} prueba(s) fallaron` : `\nLas ${resultados.length} pruebas pasaron`);
  process.exitCode = fallas ? 1 : 0;
}

main().catch((err) => {
  console.error("Error en la prueba end-to-end:", err.message);
  process.exit(1);
});

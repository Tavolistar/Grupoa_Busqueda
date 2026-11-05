const autocannon = require("autocannon");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const DURATION = Number(process.env.DURACION) || 10;
const CONNECTIONS = Number(process.env.CONEXIONES) || 20;

function ejecutar(opts) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(opts);
    instance.on("done", resolve);
    instance.on("error", reject);
    instance.on("reqError", () => {});
  });
}

function p95(latency) {
  if (!latency) return 0;
  return latency.p95 != null ? latency.p95 : latency.p97_5;
}

function fila(nombre, result) {
  const l = result.latency || {};
  return {
    escenario: nombre,
    "req/s": Math.round(result.requests.average || 0),
    "lat media (ms)": Number((l.mean || 0).toFixed(1)),
    "p50 (ms)": Number((l.p50 || 0).toFixed(1)),
    "p90 (ms)": Number((l.p90 || 0).toFixed(1)),
    "P95 (ms)": Number((p95(l) || 0).toFixed(1)),
    "p99 (ms)": Number((l.p99 || 0).toFixed(1)),
  };
}

async function main() {
  console.log(
    `Pruebas de carga contra ${BASE_URL} (duracion ${DURATION}s, conexiones ${CONNECTIONS})\n`
  );

  let contador = 0;
  const sinCache = await ejecutar({
    url: BASE_URL,
    connections: CONNECTIONS,
    duration: DURATION,
    timeout: 30,
    setupRequest: (request) => {
      contador += 1;
      request.path = `/api/busqueda/productos?q=${encodeURIComponent(
        "camisa " + contador
      )}`;
      return request;
    },
  });

  await fetch(`${BASE_URL}/api/busqueda/productos?q=camisa`);
  await fetch(`${BASE_URL}/api/busqueda/productos?q=camisa`);
  const conCache = await ejecutar({
    url: `${BASE_URL}/api/busqueda/productos?q=camisa`,
    connections: CONNECTIONS,
    duration: DURATION,
    timeout: 30,
  });

  const filas = [
    fila("Sin cache (MISS -> Elasticsearch)", sinCache),
    fila("Con cache (HIT -> Redis)", conCache),
  ];
  console.table(filas);

  const p95Sin = p95(sinCache.latency);
  const p95Con = p95(conCache.latency);
  console.log("\nMetas (P95):");
  console.log(
    `  con cache < 100 ms : ${p95Con < 100 ? "CUMPLE" : "NO cumple"} (${p95Con.toFixed(1)} ms)`
  );
  console.log(
    `  sin cache < 1 s    : ${p95Sin < 1000 ? "CUMPLE" : "NO cumple"} (${p95Sin.toFixed(1)} ms)`
  );
}

main().catch((err) => {
  console.error("Error en carga:", err && err.message ? err.message : err);
  process.exit(1);
});

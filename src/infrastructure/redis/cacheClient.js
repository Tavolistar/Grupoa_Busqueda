const { createClient } = require("redis");

let client = null;
let conectado = false;
let inicializando = null;

function getRedisUrl() {
  return process.env.REDIS_URL || "redis://localhost:6379";
}

async function conectar() {
  if (conectado && client) {
    return client;
  }
  if (inicializando) {
    return inicializando;
  }

  inicializando = (async () => {
    try {
      client = createClient({
        url: getRedisUrl(),
        socket: {
          connectTimeout: 2000,
          // Sin límite, node-redis reintenta para siempre si Redis no está y el proceso nunca termina
          reconnectStrategy: (intentos) =>
            intentos >= 3 ? new Error("Redis no disponible") : Math.min(intentos * 200, 1000),
        },
      });

      client.on("error", (err) => {
        conectado = false;
        console.warn("[Redis] Error de conexión:", err && err.message ? err.message : err);
      });

      client.on("connect", () => {
        conectado = true;
        console.log("[Redis] Conectando...");
      });

      client.on("ready", () => {
        conectado = true;
        console.log("[Redis] Listo");
      });

      client.on("reconnecting", () => {
        console.warn("[Redis] Reconectando...");
      });

      client.on("end", () => {
        conectado = false;
      });

      await client.connect();
      conectado = client.isOpen || true;
      return client;
    } catch (err) {
      conectado = false;
      console.warn("[Redis] No se pudo conectar a Redis. Operando en modo sin caché:", err && err.message ? err.message : err);
      inicializando = null;
      client = null;
      throw err;
    }
  })();

  try {
    const c = await inicializando;
    return c;
  } catch (err) {
    inicializando = null;
    client = null;
    conectado = false;
    // Graceful degradation: no lanzar excepción
    return null;
  }
}

async function getClient() {
  try {
    const c = await conectar();
    if (!c || !c.isOpen) {
      conectado = false;
      return null;
    }
    conectado = true;
    return c;
  } catch (err) {
    conectado = false;
    console.warn("[Redis] getClient fallo (graceful):", err && err.message ? err.message : err);
    return null;
  }
}

function estaConectado() {
  return conectado && client && client.isOpen;
}

// Cierra la conexión para que procesos cortos (pruebas, scripts) puedan terminar
async function cerrar() {
  const c = client;
  client = null;
  conectado = false;
  inicializando = null;
  if (c && c.isOpen) {
    try {
      await c.quit();
    } catch (err) {
      // ignorar: la conexión ya estaba cerrándose
    }
  }
}

module.exports = {
  conectar,
  getClient,
  estaConectado,
  cerrar,
};

const crypto = require("crypto");
const { getClient } = require("../redis/cacheClient");

const TTL = 300; // segundos (5 minutos)
const PREFIX_BUSQUEDA = "busqueda";
const PREFIX_PRODUCTO_KEYS = "busqueda:prod:";

function normalizarParams(params = {}) {
  const ordenados = {};
  const keys = Object.keys(params || {}).sort();
  for (const k of keys) {
    const v = params[k];
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      ordenados[k] = [...v].sort().join(",");
    } else {
      ordenados[k] = String(v);
    }
  }
  return ordenados;
}

function generarClave(params) {
  const normalizados = normalizarParams(params);
  const json = JSON.stringify(normalizados);
  const hash = crypto.createHash("sha256").update(json).digest("hex");
  return `${PREFIX_BUSQUEDA}:${hash}`;
}

function generarClaveProductoIndex(productoId) {
  return `${PREFIX_PRODUCTO_KEYS}${productoId}`;
}

async function obtenerBusqueda(params) {
  try {
    const client = await getClient();
    if (!client) {
      return null;
    }
    const clave = generarClave(params);
    const valor = await client.get(clave);
    if (!valor) {
      return null;
    }
    try {
      return JSON.parse(valor);
    } catch (e) {
      console.warn("[cacheBusqueda] Error parseando valor cacheado:", e && e.message ? e.message : e);
      return null;
    }
  } catch (err) {
    console.warn("[cacheBusqueda] obtenerBusqueda fallo (graceful):", err && err.message ? err.message : err);
    return null;
  }
}

async function guardarBusqueda(params, resultado, productoIds = []) {
  try {
    const client = await getClient();
    if (!client) {
      return false;
    }
    const clave = generarClave(params);
    const payload = JSON.stringify(resultado);
    await client.setEx(clave, TTL, payload);

    if (Array.isArray(productoIds) && productoIds.length > 0) {
      const pipeline = client.multi ? client.multi() : null;
      for (const pid of productoIds) {
        if (!pid) continue;
        const cprod = generarClaveProductoIndex(pid);
        if (pipeline) {
          pipeline.sAdd(cprod, clave);
          pipeline.expire(cprod, TTL * 2);
        } else {
          try {
            await client.sAdd(cprod, clave);
            await client.expire(cprod, TTL * 2);
          } catch (e) {
            // ignorar errores por producto
          }
        }
      }
      if (pipeline) {
        try {
          await pipeline.exec();
        } catch (e) {
          // ignorar
        }
      }
    }
    return true;
  } catch (err) {
    console.warn("[cacheBusqueda] guardarBusqueda fallo (graceful):", err && err.message ? err.message : err);
    return false;
  }
}

async function invalidarCachePorProducto(productoId) {
  try {
    if (!productoId) return false;
    const client = await getClient();
    if (!client) {
      console.warn("[cacheBusqueda] invalidarCachePorProducto: Redis no disponible (graceful)");
      return false;
    }
    const cprod = generarClaveProductoIndex(productoId);
    let claves = [];
    try {
      if (typeof client.sMembers === "function") {
        claves = await client.sMembers(cprod);
      } else if (typeof client.smembers === "function") {
        claves = await client.smembers(cprod);
      }
    } catch (e) {
      console.warn("[cacheBusqueda] Error obteniendo claves asociadas:", e && e.message ? e.message : e);
      return false;
    }

    if (!Array.isArray(claves) || claves.length === 0) {
      try {
        if (typeof client.del === "function") {
          await client.del(cprod);
        }
      } catch (e) {
        // ignorar
      }
      return false;
    }

    const pipeline = client.multi ? client.multi() : null;
    if (pipeline) {
      for (const k of claves) {
        if (k) pipeline.del(k);
      }
      pipeline.del(cprod);
      try {
        await pipeline.exec();
      } catch (e) {
        console.warn("[cacheBusqueda] Error en pipeline de invalidación:", e && e.message ? e.message : e);
        // intentar eliminación individual como fallback
        for (const k of claves) {
          try {
            if (k && typeof client.del === "function") await client.del(k);
          } catch (_) {}
        }
        try {
          if (typeof client.del === "function") await client.del(cprod);
        } catch (_) {}
      }
    } else {
      for (const k of claves) {
        try {
          if (k && typeof client.del === "function") await client.del(k);
        } catch (e) {
          console.warn("[cacheBusqueda] Error borrando clave cache:", e && e.message ? e.message : e);
        }
      }
      try {
        if (typeof client.del === "function") await client.del(cprod);
      } catch (e) {
        console.warn("[cacheBusqueda] Error borrando índice producto:", e && e.message ? e.message : e);
      }
    }
    return true;
  } catch (err) {
    console.warn("[cacheBusqueda] invalidarCachePorProducto fallo (graceful):", err && err.message ? err.message : err);
    return false;
  }
}

module.exports = {
  obtenerBusqueda,
  guardarBusqueda,
  generarClave,
  invalidarCachePorProducto,
};

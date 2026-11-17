// src/infrastructure/eureka/registroEureka.js
//
// Registro y ciclo de vida de la instancia en Eureka (Contrato de Búsqueda v2.0, Sec. 4.1).
//
// Operaciones REST contra Eureka (prefijo /eureka por defecto):
//   POST   /apps/{APP}                       -> alta de la instancia
//   PUT    /apps/{APP}/{INSTANCE}            -> latido (heartbeat)
//   PUT    /apps/{APP}/{INSTANCE}/status     -> cambio de estado (UP / DOWN)
//   DELETE /apps/{APP}/{INSTANCE}            -> baja de la instancia
//
// Si `process.env.EUREKA_URL` no está definida o está vacía, `registrarEnEureka`
// retorna `null` sin lanzar errores (modo local / sin descubrimiento).
//
// Todos los fallos de red se toleran (se registran como advertencia) para que la
// caída o ausencia de Eureka nunca tumbe el microservicio de búsqueda.

const os = require("os");

const INTERVALO_LATIDO_MS = 10_000;
const RUTA_CONTEXTO_POR_DEFECTO = "/eureka";

function construirBaseUrl(eurekaUrl) {
  const url = new URL(eurekaUrl);
  let ruta = url.pathname.replace(/\/+$/, "");
  if (ruta === "") ruta = RUTA_CONTEXTO_POR_DEFECTO;
  return `${url.origin}${ruta}`;
}

function construirInstancia({ app, puerto, hostName, rutaSalud }) {
  const nombreApp = String(app);
  return {
    appId: nombreApp.toUpperCase(),
    instanceId: `${nombreApp}:${puerto}`,
    hostName,
    port: Number(puerto),
    vipAddress: nombreApp,
    status: "UP",
    healthCheckUrl: `http://${hostName}:${puerto}${rutaSalud}`,
  };
}

function construirPayload(instancia) {
  return {
    instance: {
      instanceId: instancia.instanceId,
      hostName: instancia.hostName,
      app: instancia.appId,
      ipAddr: instancia.hostName,
      status: instancia.status,
      port: { $: instancia.port, "@enabled": true },
      securePort: { $: 443, "@enabled": false },
      vipAddress: instancia.vipAddress,
      secureVipAddress: instancia.vipAddress,
      healthCheckUrl: instancia.healthCheckUrl,
      statusPageUrl: instancia.healthCheckUrl,
      homePageUrl: `http://${instancia.hostName}:${instancia.port}/`,
      dataCenterInfo: {
        "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
        name: "MyOwn",
      },
    },
  };
}

function registrarEnEureka({ app, puerto, rutaSalud, comprobarSalud } = {}) {
  const eurekaUrl = process.env.EUREKA_URL;
  if (!eurekaUrl || !String(eurekaUrl).trim()) {
    return null;
  }

  const base = construirBaseUrl(eurekaUrl);
  const hostName = process.env.HOSTNAME || os.hostname();
  const instancia = construirInstancia({
    app,
    puerto: puerto || process.env.PORT || 3000,
    hostName,
    rutaSalud: rutaSalud || "/api/busqueda/productos",
  });

  const urlInstancia = `${base}/apps/${instancia.appId}/${instancia.instanceId}`;
  const urlColeccion = `${base}/apps/${instancia.appId}`;

  let detenido = false;
  let temporizador = null;

  async function comprobarEstado() {
    if (typeof comprobarSalud !== "function") return true;
    try {
      return await comprobarSalud();
    } catch {
      return false;
    }
  }

  async function enviarRuta(url, opciones) {
    const respuesta = await fetch(url, opciones);
    return respuesta;
  }

  async function registrar() {
    const salud = await comprobarEstado();
    instancia.status = salud ? "UP" : "DOWN";
    try {
      const respuesta = await enviarRuta(urlColeccion, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(construirPayload(instancia)),
      });
      return respuesta.status;
    } catch (err) {
      console.warn("[Eureka] No se pudo registrar la instancia:", err.message);
      return null;
    }
  }

  async function latir() {
    if (detenido) return;
    try {
      const respuesta = await enviarRuta(urlInstancia, { method: "PUT" });
      if (respuesta.status === 404) {
        // Eureka expiró la instancia: se vuelve a registrar.
        await registrar();
      }
    } catch (err) {
      console.warn("[Eureka] Latido fallido:", err.message);
    }
  }

  async function actualizarEstado(valor) {
    instancia.status = valor;
    if (detenido) return;
    try {
      await enviarRuta(`${urlInstancia}/status?value=${valor}`, { method: "PUT" });
    } catch (err) {
      console.warn(`[Eureka] No se pudo actualizar el estado a ${valor}:`, err.message);
    }
  }

  async function marcarArriba() {
    await actualizarEstado("UP");
  }

  async function marcarAbajo() {
    await actualizarEstado("DOWN");
  }

  async function detener() {
    if (detenido) return;
    detenido = true;
    if (temporizador) {
      clearInterval(temporizador);
      temporizador = null;
    }
    try {
      await enviarRuta(urlInstancia, { method: "DELETE" });
    } catch (err) {
      console.warn("[Eureka] No se pudo dar de baja la instancia:", err.message);
    }
  }

  // Alta inicial en segundo plano: se lanza y se continúa aunque Eureka no responda.
  const altaInicial = registrar();
  temporizador = setInterval(latir, INTERVALO_LATIDO_MS);
  // No debe mantener vivo el proceso por sí mismo.
  if (typeof temporizador.unref === "function") temporizador.unref();

  return {
    appId: instancia.appId,
    instanceId: instancia.instanceId,
    baseUrl: base,
    altaInicial,
    registrar,
    latir,
    marcarArriba,
    marcarAbajo,
    detener,
  };
}

module.exports = { registrarEnEureka };
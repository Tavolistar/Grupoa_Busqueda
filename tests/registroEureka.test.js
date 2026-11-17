// tests/registroEureka.test.js
//
// Verifica el registro en Eureka contra un servidor HTTP mock (sin dependencias externas).
// Cubre: ausencia de EUREKA_URL, alta POST + latidos PUT, re-registro ante 404,
// cambio de estado DOWN/UP, tolerancia ante Eureka caído y baja DELETE al detenerse.

const http = require("http");
const { registrarEnEureka } = require("../src/infrastructure/eureka/registroEureka");

const PUERTO_INSTANCIA = 3000;
const RUTA_INSTANCIA = `/eureka/apps/BUSQUEDA/busqueda:${PUERTO_INSTANCIA}`;

function crearEurekaMock({ latidoStatus = 200 } = {}) {
  const estado = { latidoStatus, requests: [] };
  const servidor = http.createServer((req, res) => {
    const url = req.url || "";
    estado.requests.push({ method: req.method, url });

    // Secuencia de "no encontrado" para el latido, configurable.
    const esLatido =
      req.method === "PUT" && url.startsWith("/eureka/apps/") && !url.includes("/status");

    if (esLatido) {
      res.statusCode = estado.latidoStatus;
      res.end();
      return;
    }
    // Alta (POST), cambio de estado (PUT .../status) y baja (DELETE) -> éxito.
    res.statusCode = req.method === "POST" ? 204 : 200;
    res.end();
  });

  return {
    estado,
    iniciar: () =>
      new Promise((resolve) => servidor.listen(0, "127.0.0.1", () => resolve(servidor))),
    detener: () => new Promise((resolve) => servidor.close(resolve)),
    url: (puerto) => `http://127.0.0.1:${puerto}`,
    contar: (metodo, filtro = () => true) =>
      estado.requests.filter((r) => r.method === metodo && filtro(r.url)).length,
  };
}

describe("registroEureka", () => {
  let eureka;
  let puerto;
  let registro;
  let EUREKA_URL_ORIGINAL;

  beforeEach(async () => {
    EUREKA_URL_ORIGINAL = process.env.EUREKA_URL;
    eureka = crearEurekaMock();
    const servidor = await eureka.iniciar();
    puerto = servidor.address().port;
  });

  afterEach(async () => {
    if (registro) await registro.detener();
    await eureka.detener();
    if (EUREKA_URL_ORIGINAL === undefined) delete process.env.EUREKA_URL;
    else process.env.EUREKA_URL = EUREKA_URL_ORIGINAL;
  });

  test("sin EUREKA_URL retorna null sin lanzar errores", () => {
    delete process.env.EUREKA_URL;
    expect(() => registrarEnEureka({ app: "busqueda", puerto: PUERTO_INSTANCIA })).not.toThrow();
    expect(registrarEnEureka({ app: "busqueda", puerto: PUERTO_INSTANCIA })).toBeNull();
  });

  test("EUREKA_URL vacía también retorna null", () => {
    process.env.EUREKA_URL = "   ";
    expect(registrarEnEureka({ app: "busqueda", puerto: PUERTO_INSTANCIA })).toBeNull();
  });

  test("registro inicial POST y latido PUT", async () => {
    process.env.EUREKA_URL = eureka.url(puerto);
    registro = registrarEnEureka({
      app: "busqueda",
      puerto: PUERTO_INSTANCIA,
      rutaSalud: "/api/busqueda/productos",
      comprobarSalud: async () => true,
    });

    await registro.altaInicial;
    expect(eureka.contar("POST", (u) => u === "/eureka/apps/BUSQUEDA")).toBe(1);

    await registro.latir();
    expect(eureka.contar("PUT", (u) => u.startsWith(RUTA_INSTANCIA) && !u.includes("/status"))).toBe(1);
  });

  test("re-registro (POST) ante un latido con 404", async () => {
    eureka.estado.latidoStatus = 404;
    process.env.EUREKA_URL = eureka.url(puerto);
    registro = registrarEnEureka({
      app: "busqueda",
      puerto: PUERTO_INSTANCIA,
      comprobarSalud: async () => true,
    });

    await registro.altaInicial;
    const postsAntes = eureka.contar("POST");
    await registro.latir();
    expect(eureka.contar("POST")).toBe(postsAntes + 1);
  });

  test("cambio de estado DOWN y UP vía /status?value=", async () => {
    process.env.EUREKA_URL = eureka.url(puerto);
    registro = registrarEnEureka({
      app: "busqueda",
      puerto: PUERTO_INSTANCIA,
      comprobarSalud: async () => true,
    });
    await registro.altaInicial;

    await registro.marcarAbajo();
    await registro.marcarArriba();

    expect(eureka.contar("PUT", (u) => u === `${RUTA_INSTANCIA}/status?value=DOWN`)).toBe(1);
    expect(eureka.contar("PUT", (u) => u === `${RUTA_INSTANCIA}/status?value=UP`)).toBe(1);
  });

  test("tolera que Eureka no responda (no lanza y retorna registro)", async () => {
    await eureka.detener(); // apagamos el servidor para provocar fallo de conexión
    process.env.EUREKA_URL = "http://127.0.0.1:1"; // puerto no accesible

    expect(() =>
      registrarEnEureka({ app: "busqueda", puerto: PUERTO_INSTANCIA, comprobarSalud: async () => false })
    ).not.toThrow();

    registro = registrarEnEureka({
      app: "busqueda",
      puerto: PUERTO_INSTANCIA,
      comprobarSalud: async () => false,
    });
    await expect(registro.altaInicial).resolves.not.toThrow();
    await expect(registro.latir()).resolves.not.toThrow();
  });

  test("DELETE al detenerse", async () => {
    process.env.EUREKA_URL = eureka.url(puerto);
    registro = registrarEnEureka({
      app: "busqueda",
      puerto: PUERTO_INSTANCIA,
      comprobarSalud: async () => true,
    });
    await registro.altaInicial;

    await registro.detener();
    expect(eureka.contar("DELETE", (u) => u === RUTA_INSTANCIA)).toBe(1);
  });

  test("construye la URL con contexto /eureka cuando EUREKA_URL no lo incluye", async () => {
    process.env.EUREKA_URL = eureka.url(puerto);
    registro = registrarEnEureka({ app: "busqueda", puerto: PUERTO_INSTANCIA });
    expect(registro.baseUrl).toBe(`${eureka.url(puerto)}/eureka`);
    await registro.altaInicial;
  });
});
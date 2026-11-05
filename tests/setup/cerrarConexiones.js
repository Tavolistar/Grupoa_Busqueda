// Se ejecuta en cada archivo de pruebas: cierra la conexión real a Redis que abren las rutas.
// Sin esto Jest nunca termina y el CI se cancela a las 6 horas.
afterAll(async () => {
  const redis = require("../../src/infrastructure/redis/cacheClient");
  // En los archivos que simulan Redis con jest.mock no hay nada que cerrar
  if (typeof redis.cerrar === "function") {
    await redis.cerrar();
  }
});

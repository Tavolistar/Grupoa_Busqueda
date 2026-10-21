const { app } = require("../src/infrastructure/http/server");

describe("Humo", () => {
  test("server se puede importar correctamente", () => {
    expect(app).toBeDefined();
  });
});

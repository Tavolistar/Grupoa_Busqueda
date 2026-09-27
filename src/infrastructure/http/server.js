const express = require("express");
const busquedaRoutes = require("./routes/busquedaRoutes");
 
const app = express();
app.use(express.json());
app.use("/api/busqueda", busquedaRoutes);
 
function iniciarServidor() {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT} 🚀`));
}
 
module.exports = { iniciarServidor };

const express = require("express");
const router = express.Router();
const { buscarProductos } = require("../../../application/buscarProductos");
 
router.get("/productos", async (req, res) => {
  const { q = "", pagina = 1, tamanoPagina = 20 } = req.query;
  const resultado = await buscarProductos(q, Number(pagina), Number(tamanoPagina));
  res.status(200).json(resultado);
});
 
module.exports = router;

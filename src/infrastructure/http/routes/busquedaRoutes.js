const express = require("express");
const router = express.Router();
const { buscarProductos } = require("../../../application/buscarProductos");
const { obtenerSugerencias } = require("../../../application/obtenerSugerencias");
router.get("/productos", async (req, res) => {
  const { q = "", pagina = 1, tamanoPagina = 20 } = req.query;
  const resultado = await buscarProductos(q, Number(pagina), Number(tamanoPagina));
  res.status(200).json(resultado);
});

router.get("/sugerencias", async (req, res) => {
  try {
    const resultado = await obtenerSugerencias(req.query.q || "");
    res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo sugerencias" });
  }
});

module.exports = router;

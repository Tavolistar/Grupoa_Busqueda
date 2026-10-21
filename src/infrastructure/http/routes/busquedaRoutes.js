const express = require("express");
const router = express.Router();
const { buscarProductos } = require("../../../application/buscarProductos");
const { obtenerSugerencias } = require("../../../application/obtenerSugerencias");
const { parsearParametros } = require("../../../application/parametros");
const { validar: validarPrecio } = require("../../../application/filtros/precio");
const { validar: validarOrden } = require("../../../application/orden");

router.get("/productos", async (req, res) => {
  const params = parsearParametros(req.query);
  const error = validarPrecio(params) || validarOrden(params);

  if (error) return res.status(400).json({ error });

  try {
    const resultado = await buscarProductos(params);
    res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en la búsqueda" });
  }
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

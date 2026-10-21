const express = require("express");
const router = express.Router();
const { buscarProductos } = require("../../../application/buscarProductos");
const { obtenerSugerencias } = require("../../../application/obtenerSugerencias");
const { parsearParametros } = require("../../../application/parametros");
const { validar: validarPrecio } = require("../../../application/filtros/precio");
const { validar: validarOrden } = require("../../../application/orden");

router.get("/productos", async (req, res) => {
  try {
    const params = parsearParametros(req.query);
    try {
      validarPrecio({ minPrice: params.minPrice, maxPrice: params.maxPrice });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    try {
      validarOrden({ orden: params.orden, direccion: params.direccion });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
    const resultado = await buscarProductos(params);
    res.status(200).json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar productos" });
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

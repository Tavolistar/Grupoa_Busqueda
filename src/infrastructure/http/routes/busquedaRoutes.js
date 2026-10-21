// src/infrastructure/http/routes/busquedaRoutes.js
// OJO: si tu /sugerencias actual tiene otra lógica, conserva la tuya y copia solo el handler /productos.
const express = require("express");
const router = express.Router();
const { buscarProductos } = require("../../../application/buscarProductos");
const { obtenerSugerencias } = require("../../../application/obtenerSugerencias");
const { parsearParametros, validarPrecio, validarOrden } = require("../../../application/parametros");

router.get("/productos", async (req, res) => {
  const params = parsearParametros(req.query);
  const error = validarPrecio(params) || validarOrden(params);
  if (error) return res.status(400).json({ error });
  try {
    res.status(200).json(await buscarProductos(params));
  } catch (err) {
    console.error("Error en /productos:", err);
    res.status(500).json({ error: "Error en la búsqueda" });
  }
});

router.get("/sugerencias", async (req, res) => {
  try {
    res.status(200).json(await obtenerSugerencias(String(req.query.q ?? "").trim()));
  } catch (err) {
    console.error("Error en /sugerencias:", err);
    res.status(500).json({ error: "Error en las sugerencias" });
  }
});

module.exports = router;

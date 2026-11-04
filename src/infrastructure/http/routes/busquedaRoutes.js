const express = require("express");
const router = express.Router();
const { buscarProductos } = require("../../../application/buscarProductos");
const { obtenerSugerencias } = require("../../../application/obtenerSugerencias");
const { parsearParametros } = require("../../../application/parametros");
const { validar: validarPrecio } = require("../../../application/filtros/precio");
const { validar: validarOrden } = require("../../../application/orden");
const { validarPaginacion } = require("../../../application/paginacion");
const { obtenerBusqueda, guardarBusqueda } = require("../../cache/cacheBusqueda");

function extraerProductoIds(resultado) {
  try {
    if (!resultado) return [];
    if (Array.isArray(resultado)) {
      return resultado.map((p) => p && (p.id || p._id || p.productoId)).filter(Boolean);
    }
    if (Array.isArray(resultado.productos)) {
      return resultado.productos.map((p) => p && (p.id || p._id || p.productoId)).filter(Boolean);
    }
    if (Array.isArray(resultado.items)) {
      return resultado.items.map((p) => p && (p.id || p._id || p.productoId)).filter(Boolean);
    }
    if (Array.isArray(resultado.results)) {
      return resultado.results.map((p) => p && (p.id || p._id || p.productoId)).filter(Boolean);
    }
  } catch (e) {
    // ignore
  }
  return [];
}

router.get("/productos", async (req, res) => {
  const params = parsearParametros(req.query);
  const error = validarPrecio(params) || validarOrden(params) || validarPaginacion(params);

  if (error) return res.status(400).json({ error });

  try {
    // Intentar obtener desde caché
    const cacheado = await obtenerBusqueda(params);
    if (cacheado !== null && cacheado !== undefined) {
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(cacheado);
    }

    // MISS: ejecutar búsqueda normal
    const resultado = await buscarProductos(params);
    res.setHeader("X-Cache", "MISS");
    // Guardar en caché asincrónicamente (no bloquear respuesta)
    const productoIds = extraerProductoIds(resultado);
    guardarBusqueda(params, resultado, productoIds).catch(() => {});

    return res.status(200).json(resultado);
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

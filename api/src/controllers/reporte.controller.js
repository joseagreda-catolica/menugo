const reporteService = require('../services/reporte.service');

async function ventas(req, res, next) {
  try {
    res.json(await reporteService.ventasPorRango(req.query.desde, req.query.hasta));
  } catch (err) {
    next(err);
  }
}

async function rankingPlatillos(req, res, next) {
  try {
    res.json(await reporteService.rankingPlatillos(req.query.desde, req.query.hasta));
  } catch (err) {
    next(err);
  }
}

async function distribucionPorFranja(req, res, next) {
  try {
    res.json(await reporteService.distribucionPorFranja(req.query.desde, req.query.hasta));
  } catch (err) {
    next(err);
  }
}

module.exports = { ventas, rankingPlatillos, distribucionPorFranja };

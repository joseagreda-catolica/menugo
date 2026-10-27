const configuracionService = require('../services/configuracion.service');

async function obtener(req, res, next) {
  try {
    res.json(await configuracionService.obtener());
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    res.json(await configuracionService.actualizar(req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { obtener, actualizar };

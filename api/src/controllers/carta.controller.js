const cartaService = require('../services/carta.service');

async function obtenerCartaPublica(req, res, next) {
  try {
    const categoriaId = req.query.categoria ? Number(req.query.categoria) : undefined;
    const buscar = typeof req.query.buscar === 'string' ? req.query.buscar : undefined;
    res.json(await cartaService.obtenerCartaPublica({ categoriaId, buscar }));
  } catch (err) {
    next(err);
  }
}

module.exports = { obtenerCartaPublica };

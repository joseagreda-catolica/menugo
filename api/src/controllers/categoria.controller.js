const categoriaService = require('../services/categoria.service');

async function listar(req, res, next) {
  try {
    res.json(await categoriaService.listar());
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    res.status(201).json(await categoriaService.crear(req.body));
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const id = Number(req.params.id);
    res.json(await categoriaService.actualizar(id, req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, crear, actualizar };

const platilloService = require('../services/platillo.service');
const imagenService = require('../services/imagen.service');
const AppError = require('../lib/AppError');

async function listar(req, res, next) {
  try {
    res.json(await platilloService.listar());
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    res.status(201).json(await platilloService.crear(req.body));
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const id = Number(req.params.id);
    res.json(await platilloService.actualizar(id, req.body));
  } catch (err) {
    next(err);
  }
}

async function actualizarDisponibilidad(req, res, next) {
  try {
    const id = Number(req.params.id);
    res.json(await platilloService.actualizarDisponibilidad(id, req.body.disponible));
  } catch (err) {
    next(err);
  }
}

async function subirImagen(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError(400, 'ARCHIVO_REQUERIDO', 'Debes adjuntar un archivo en el campo "imagen".');
    }
    const id = Number(req.params.id);
    const fotoUrl = await imagenService.subir(req.file.buffer, req.file.originalname);
    await platilloService.actualizar(id, { fotoUrl });
    res.json({ fotoUrl });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, crear, actualizar, actualizarDisponibilidad, subirImagen };

const AppError = require('../lib/AppError');
const categoriaRepository = require('../repositories/categoria.repository');

function listar() {
  return categoriaRepository.findAll();
}

function crear(data) {
  return categoriaRepository.create(data);
}

async function actualizar(id, data) {
  const existente = await categoriaRepository.findById(id);
  if (!existente) {
    throw new AppError(404, 'NO_ENCONTRADO', `No existe la categoria ${id}.`);
  }
  return categoriaRepository.update(id, data);
}

module.exports = { listar, crear, actualizar };

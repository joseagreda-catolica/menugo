const prisma = require('../lib/prisma');

function findAll() {
  return prisma.categoria.findMany({ orderBy: { orden: 'asc' } });
}

function findById(id) {
  return prisma.categoria.findUnique({ where: { id } });
}

function create(data) {
  return prisma.categoria.create({ data });
}

function update(id, data) {
  return prisma.categoria.update({ where: { id }, data });
}

module.exports = { findAll, findById, create, update };

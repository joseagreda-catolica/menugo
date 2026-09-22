const prisma = require('../lib/prisma');

const CON_PRECIO_VIGENTE = {
  include: { preciosHistoricos: { where: { vigenteHasta: null }, take: 1 } },
};

function findAll() {
  return prisma.platillo.findMany({
    ...CON_PRECIO_VIGENTE,
    orderBy: [{ categoriaId: 'asc' }, { orden: 'asc' }],
  });
}

function findById(id) {
  return prisma.platillo.findUnique({ where: { id }, ...CON_PRECIO_VIGENTE });
}

function create(data) {
  return prisma.platillo.create({ data, ...CON_PRECIO_VIGENTE });
}

function update(id, data) {
  return prisma.platillo.update({ where: { id }, data, ...CON_PRECIO_VIGENTE });
}

module.exports = { findAll, findById, create, update };

const prisma = require('../lib/prisma');

function findByClave(clave) {
  return prisma.configuracion.findUnique({ where: { clave } });
}

function upsert(clave, valor) {
  return prisma.configuracion.upsert({
    where: { clave },
    update: { valor },
    create: { clave, valor },
  });
}

module.exports = { findByClave, upsert };

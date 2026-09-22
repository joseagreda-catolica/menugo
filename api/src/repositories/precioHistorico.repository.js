const prisma = require('../lib/prisma');

function findVigente(platilloId) {
  return prisma.precioHistorico.findFirst({
    where: { platilloId, vigenteHasta: null },
  });
}

function cerrarVigente(platilloId) {
  return prisma.precioHistorico.updateMany({
    where: { platilloId, vigenteHasta: null },
    data: { vigenteHasta: new Date() },
  });
}

function crear(platilloId, precio) {
  return prisma.precioHistorico.create({ data: { platilloId, precio } });
}

module.exports = { findVigente, cerrarVigente, crear };

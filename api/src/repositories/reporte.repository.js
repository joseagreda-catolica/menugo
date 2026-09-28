const prisma = require('../lib/prisma');

function cuentasCerradasEnRango(desde, hasta) {
  return prisma.cuenta.findMany({
    where: { cerradaEn: { not: null, gte: desde, lte: hasta } },
  });
}

function lineasEnRango(desde, hasta) {
  return prisma.pedidoLinea.findMany({
    where: {
      estado: { not: 'anulada' },
      creadaEn: { gte: desde, lte: hasta },
    },
    include: { platillo: true },
  });
}

module.exports = { cuentasCerradasEnRango, lineasEnRango };

const prisma = require('../lib/prisma');

function crear({ usuarioId, accion, entidad, entidadId, detalle }) {
  return prisma.bitacora.create({
    data: { usuarioId, accion, entidad, entidadId, detalle },
  });
}

module.exports = { crear };

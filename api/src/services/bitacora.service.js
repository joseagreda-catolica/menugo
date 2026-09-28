const bitacoraRepository = require('../repositories/bitacora.repository');

// RF-30: servicio unico que registra operaciones sensibles. Se invoca desde
// las anulaciones de pedido, los cambios de precio y los cierres de caja,
// para que ninguno de esos flujos tenga que reimplementar el registro.
const ACCIONES = ['anulacion_pedido', 'cambio_precio', 'cierre_caja'];

function registrar({ usuarioId, accion, entidad, entidadId, detalle }) {
  if (!ACCIONES.includes(accion)) {
    throw new Error(`Accion de bitacora desconocida: ${accion}`);
  }
  return bitacoraRepository.crear({ usuarioId, accion, entidad, entidadId, detalle });
}

module.exports = { registrar, ACCIONES };

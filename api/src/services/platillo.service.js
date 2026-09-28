const AppError = require('../lib/AppError');
const platilloRepository = require('../repositories/platillo.repository');
const precioService = require('./precio.service');
const bitacoraService = require('./bitacora.service');

// El API siempre devuelve el precio ya resuelto como un campo plano (ver
// docs/contrato-api-carta.md): el frontend no necesita saber que el precio
// vive en una tabla de historial aparte.
function mapear(platillo) {
  const { preciosHistoricos, ...resto } = platillo;
  const vigente = preciosHistoricos && preciosHistoricos[0];
  return { ...resto, precio: vigente ? Number(vigente.precio) : null };
}

async function listar() {
  const platillos = await platilloRepository.findAll();
  return platillos.map(mapear);
}

async function crear({ precio, ...datosPlatillo }) {
  const platillo = await platilloRepository.create(datosPlatillo);
  await precioService.actualizarPrecio(platillo.id, precio);
  const conPrecio = await platilloRepository.findById(platillo.id);
  return mapear(conPrecio);
}

async function actualizar(id, { precio, ...datosPlatillo }, usuarioId) {
  const existente = await platilloRepository.findById(id);
  if (!existente) {
    throw new AppError(404, 'NO_ENCONTRADO', `No existe el platillo ${id}.`);
  }

  if (Object.keys(datosPlatillo).length > 0) {
    await platilloRepository.update(id, datosPlatillo);
  }

  if (precio !== undefined) {
    const precioAnterior = await precioService.obtenerVigente(id);
    const cambioDePrecio = !precioAnterior || Number(precioAnterior.precio) !== Number(precio);
    await precioService.actualizarPrecio(id, precio);

    // RF-30: toda variacion de precio queda en bitacora.
    if (cambioDePrecio && usuarioId) {
      await bitacoraService.registrar({
        usuarioId,
        accion: 'cambio_precio',
        entidad: 'platillo',
        entidadId: id,
        detalle: {
          precioAnterior: precioAnterior ? Number(precioAnterior.precio) : null,
          precioNuevo: Number(precio),
        },
      });
    }
  }

  const actualizado = await platilloRepository.findById(id);
  return mapear(actualizado);
}

// RF-03 / S3-12: interruptor liviano, dedicado, para que la carta publica
// refleje el cambio de inmediato sin mandar el objeto completo.
async function actualizarDisponibilidad(id, disponible) {
  const existente = await platilloRepository.findById(id);
  if (!existente) {
    throw new AppError(404, 'NO_ENCONTRADO', `No existe el platillo ${id}.`);
  }
  const actualizado = await platilloRepository.update(id, { disponible });
  return mapear(actualizado);
}

module.exports = { listar, crear, actualizar, actualizarDisponibilidad, mapear };

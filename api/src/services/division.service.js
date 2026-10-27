const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');
const { bloquearCuentaAbierta } = require('./cobro.service');

// Los importes se reparten en centavos enteros para que las partes sumen exactamente el
// total de la cuenta, sin errores de redondeo.
const aCentavos = (valor) => Math.round(Number(valor) * 100);
const deCentavos = (centavos) => centavos / 100;

// 10.00 entre 3 -> 3.34, 3.33, 3.33: los centavos que sobran van a las primeras partes.
function repartirEnPartesIguales(totalCentavos, partes) {
  const base = Math.floor(totalCentavos / partes);
  const sobrante = totalCentavos - base * partes;
  return Array.from({ length: partes }, (_, i) => base + (i < sobrante ? 1 : 0));
}

const INCLUDE_CUENTA_DIVIDIDA = {
  divisiones: { orderBy: { id: 'asc' }, include: { pagos: true } },
};

async function exigirSinPagos(tx, idCuenta) {
  const pagadas = await tx.cuentaDivision.count({ where: { cuentaId: idCuenta, pagos: { some: {} } } });
  if (pagadas > 0) {
    throw new AppError(
      409,
      'CUENTA_CON_PAGOS',
      'La cuenta ya tiene partes pagadas y no se puede volver a dividir.'
    );
  }
}

// RF-22: divide la cuenta entre varios comensales, por partes iguales o asignando
// platillos especificos a cada uno. Se puede volver a dividir mientras no haya pagos.
async function dividir(idCuenta, datos) {
  return prisma.$transaction(async (tx) => {
    const cuenta = await bloquearCuentaAbierta(tx, idCuenta);
    await exigirSinPagos(tx, idCuenta);

    const totalCentavos = aCentavos(cuenta.total);
    if (totalCentavos <= 0) {
      throw new AppError(409, 'CUENTA_SIN_SALDO', 'La cuenta no tiene saldo que dividir.');
    }

    let partes;

    if (datos.modo === 'partes_iguales') {
      partes = repartirEnPartesIguales(totalCentavos, datos.partes).map((centavos, i) => ({
        etiqueta: `Comensal ${i + 1}`,
        centavos,
      }));
    } else {
      const lineas = await tx.pedidoLinea.findMany({
        where: {
          estado: { not: 'anulada' },
          pedido: { sesionMesaId: cuenta.sesionMesaId, estado: { not: 'anulado' } },
        },
      });
      const lineaPorId = new Map(lineas.map((l) => [l.id, l]));

      const asignadas = new Set();
      for (const grupo of datos.grupos) {
        for (const idLinea of grupo.lineaIds) {
          if (!lineaPorId.has(idLinea)) {
            throw new AppError(400, 'LINEA_INVALIDA', `El platillo ${idLinea} no pertenece a esta cuenta.`);
          }
          if (asignadas.has(idLinea)) {
            throw new AppError(400, 'LINEA_REPETIDA', 'Un platillo no puede asignarse a dos comensales.');
          }
          asignadas.add(idLinea);
        }
      }
      if (asignadas.size !== lineaPorId.size) {
        const faltan = lineaPorId.size - asignadas.size;
        throw new AppError(
          400,
          'LINEAS_SIN_ASIGNAR',
          `Faltan ${faltan} ${faltan === 1 ? 'platillo' : 'platillos'} por asignar a un comensal.`
        );
      }

      partes = datos.grupos.map((grupo, i) => ({
        etiqueta: (grupo.etiqueta || '').trim() || `Comensal ${i + 1}`,
        centavos: grupo.lineaIds.reduce((suma, id) => {
          const linea = lineaPorId.get(id);
          return suma + linea.cantidad * aCentavos(linea.precioUnitario);
        }, 0),
      }));

      // El total de la cuenta manda: cualquier diferencia de centavos va a la ultima parte.
      const suma = partes.reduce((acumulado, p) => acumulado + p.centavos, 0);
      partes[partes.length - 1].centavos += totalCentavos - suma;
    }

    await tx.cuentaDivision.deleteMany({ where: { cuentaId: idCuenta } });
    await tx.cuentaDivision.createMany({
      data: partes.map((p) => ({
        cuentaId: idCuenta,
        etiqueta: p.etiqueta.slice(0, 40),
        monto: deCentavos(p.centavos),
      })),
    });

    return tx.cuenta.findUnique({ where: { id: idCuenta }, include: INCLUDE_CUENTA_DIVIDIDA });
  });
}

// Deshace la division (solo si nadie ha pagado todavia) para volver a cobrar la cuenta completa.
async function cancelarDivision(idCuenta) {
  return prisma.$transaction(async (tx) => {
    await bloquearCuentaAbierta(tx, idCuenta);
    await exigirSinPagos(tx, idCuenta);
    await tx.cuentaDivision.deleteMany({ where: { cuentaId: idCuenta } });
    return tx.cuenta.findUnique({ where: { id: idCuenta }, include: INCLUDE_CUENTA_DIVIDIDA });
  });
}

module.exports = { dividir, cancelarDivision, repartirEnPartesIguales };

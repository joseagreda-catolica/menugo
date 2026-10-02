const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');

const FORMAS_PAGO = ['efectivo', 'tarjeta', 'otro'];

// Cobra la cuenta completa. El monto lo decide el servidor (cuenta.total), no el
// cliente, igual que los precios de un pedido: un monto mandado desde el navegador
// podria cerrar una cuenta de $10.75 con un pago de $0.01.
async function cobrarCuenta({ idCuenta, formaPago, usuarioId }) {
  const forma = formaPago ? String(formaPago).toLowerCase() : 'efectivo';
  if (!FORMAS_PAGO.includes(forma)) {
    throw new AppError(400, 'FORMA_PAGO_INVALIDA', `La forma de pago debe ser: ${FORMAS_PAGO.join(', ')}.`);
  }

  return prisma.$transaction(async (tx) => {
    // Bloquea la cuenta: si dos cobros llegan a la vez, el segundo espera y luego
    // la ve ya cerrada en vez de registrar un pago duplicado.
    await tx.$queryRaw`SELECT id FROM cuenta WHERE id = ${idCuenta} FOR UPDATE`;

    const cuenta = await tx.cuenta.findUnique({ where: { id: idCuenta } });
    if (!cuenta) {
      throw new AppError(404, 'CUENTA_NO_ENCONTRADA', 'La cuenta no existe.');
    }
    if (cuenta.cerradaEn) {
      throw new AppError(409, 'CUENTA_YA_COBRADA', 'La cuenta ya fue cobrada.');
    }

    // El pago queda en el turno de caja abierto; si no hay uno, se abre a nombre
    // de quien cobra para que ningun pago quede sin turno.
    let corte = await tx.corteCaja.findFirst({ where: { cerradoEn: null }, orderBy: { id: 'desc' } });
    if (!corte) {
      corte = await tx.corteCaja.create({
        data: { cajeroId: usuarioId, turnoFecha: new Date(), abiertoEn: new Date() },
      });
    }

    const monto = Number(cuenta.total);
    const ahora = new Date();

    const division = await tx.cuentaDivision.create({
      data: { cuentaId: idCuenta, etiqueta: 'Pago Total', monto },
    });

    const pago = await tx.pago.create({
      data: { cuentaDivisionId: division.id, formaPago: forma, monto, corteCajaId: corte.id },
    });

    // Quien cobra queda registrado en la cuenta.
    await tx.cuenta.update({ where: { id: idCuenta }, data: { cerradaEn: ahora, cajeroId: usuarioId } });

    // Los pedidos de la mesa se cierran con el cobro; los anulados se dejan como estan.
    await tx.pedido.updateMany({
      where: { sesionMesaId: cuenta.sesionMesaId, estado: 'abierto' },
      data: { estado: 'cerrado', cerradoEn: ahora },
    });

    await tx.sesionMesa.update({
      where: { id: cuenta.sesionMesaId },
      data: { estado: 'cerrada', cerradaEn: ahora },
    });

    return pago;
  });
}

module.exports = { cobrarCuenta, FORMAS_PAGO };

const prisma = require('../lib/prisma');
const AppError = require('../lib/AppError');

const FORMAS_PAGO = ['efectivo', 'tarjeta', 'otro'];

function validarForma(formaPago) {
  const forma = formaPago ? String(formaPago).toLowerCase() : 'efectivo';
  if (!FORMAS_PAGO.includes(forma)) {
    throw new AppError(400, 'FORMA_PAGO_INVALIDA', `La forma de pago debe ser: ${FORMAS_PAGO.join(', ')}.`);
  }
  return forma;
}

// Bloquea la cuenta: si dos cobros llegan a la vez, el segundo espera y luego la ve ya
// cerrada en vez de registrar un pago duplicado.
async function bloquearCuentaAbierta(tx, idCuenta) {
  await tx.$queryRaw`SELECT id FROM cuenta WHERE id = ${idCuenta} FOR UPDATE`;

  const cuenta = await tx.cuenta.findUnique({ where: { id: idCuenta } });
  if (!cuenta) {
    throw new AppError(404, 'CUENTA_NO_ENCONTRADA', 'La cuenta no existe.');
  }
  if (cuenta.cerradaEn) {
    throw new AppError(409, 'CUENTA_YA_COBRADA', 'La cuenta ya fue cobrada.');
  }
  return cuenta;
}

// El pago queda en el turno de caja abierto; si no hay uno, se abre a nombre de quien
// cobra para que ningun pago quede sin turno.
async function obtenerTurno(tx, usuarioId) {
  const abierto = await tx.corteCaja.findFirst({ where: { cerradoEn: null }, orderBy: { id: 'desc' } });
  if (abierto) return abierto;
  return tx.corteCaja.create({
    data: { cajeroId: usuarioId, turnoFecha: new Date(), abiertoEn: new Date() },
  });
}

// Cierra la cuenta: queda registrado quien cobro, los pedidos de la mesa se cierran (los
// anulados se dejan como estan) y la mesa se libera.
async function cerrarCuenta(tx, cuenta, usuarioId) {
  const ahora = new Date();
  await tx.cuenta.update({ where: { id: cuenta.id }, data: { cerradaEn: ahora, cajeroId: usuarioId } });
  await tx.pedido.updateMany({
    where: { sesionMesaId: cuenta.sesionMesaId, estado: 'abierto' },
    data: { estado: 'cerrado', cerradoEn: ahora },
  });
  await tx.sesionMesa.update({
    where: { id: cuenta.sesionMesaId },
    data: { estado: 'cerrada', cerradaEn: ahora },
  });
}

// Cobra la cuenta completa. El monto lo decide el servidor (cuenta.total), no el
// cliente, igual que los precios de un pedido: un monto mandado desde el navegador
// podria cerrar una cuenta de $10.75 con un pago de $0.01.
async function cobrarCuenta({ idCuenta, formaPago, usuarioId }) {
  const forma = validarForma(formaPago);

  return prisma.$transaction(async (tx) => {
    const cuenta = await bloquearCuentaAbierta(tx, idCuenta);

    const divididas = await tx.cuentaDivision.count({ where: { cuentaId: idCuenta } });
    if (divididas > 0) {
      throw new AppError(
        409,
        'CUENTA_DIVIDIDA',
        'La cuenta está dividida: cobra cada parte o cancela la división.'
      );
    }

    const turno = await obtenerTurno(tx, usuarioId);
    const monto = Number(cuenta.total);

    const division = await tx.cuentaDivision.create({
      data: { cuentaId: idCuenta, etiqueta: 'Pago Total', monto },
    });
    const pago = await tx.pago.create({
      data: { cuentaDivisionId: division.id, formaPago: forma, monto, corteCajaId: turno.id },
    });

    await cerrarCuenta(tx, cuenta, usuarioId);
    return pago;
  });
}

// RF-22: cobra una parte de una cuenta dividida. Al pagar la ultima parte pendiente, la
// cuenta se cierra y la mesa se libera.
async function cobrarDivision({ idCuenta, idDivision, formaPago, usuarioId }) {
  const forma = validarForma(formaPago);

  return prisma.$transaction(async (tx) => {
    const cuenta = await bloquearCuentaAbierta(tx, idCuenta);

    const division = await tx.cuentaDivision.findFirst({
      where: { id: idDivision, cuentaId: idCuenta },
      include: { pagos: true },
    });
    if (!division) {
      throw new AppError(404, 'PARTE_NO_ENCONTRADA', 'Esa parte no pertenece a la cuenta.');
    }
    if (division.pagos.length > 0) {
      throw new AppError(409, 'PARTE_YA_PAGADA', 'Esa parte de la cuenta ya fue pagada.');
    }

    const turno = await obtenerTurno(tx, usuarioId);
    const pago = await tx.pago.create({
      data: { cuentaDivisionId: division.id, formaPago: forma, monto: division.monto, corteCajaId: turno.id },
    });

    const partesPendientes = await tx.cuentaDivision.count({
      where: { cuentaId: idCuenta, pagos: { none: {} } },
    });
    const cuentaCerrada = partesPendientes === 0;
    if (cuentaCerrada) {
      await cerrarCuenta(tx, cuenta, usuarioId);
    }

    return { pago, cuentaCerrada, partesPendientes };
  });
}

module.exports = { cobrarCuenta, cobrarDivision, bloquearCuentaAbierta, FORMAS_PAGO };

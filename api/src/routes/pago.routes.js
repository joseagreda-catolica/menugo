const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

const procesarCobroDirecto = async (req, res) => {
  try {
    const { cuentaId, id, formaPago, monto } = req.body;
    const paramId = req.params.id;
    const idCuenta = Number(paramId || cuentaId || id);
    const montoFinal = Number(monto);

    if (isNaN(idCuenta)) {
      return res.status(400).json({ error: 'El ID de la cuenta no es válido.' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Verificar cuenta
      const cuenta = await tx.cuenta.findUnique({
        where: { id: idCuenta },
      });

      if (!cuenta) {
        throw new Error('La cuenta a cobrar no existe.');
      }

      const montoCobrar = !isNaN(montoFinal) && montoFinal > 0 ? montoFinal : Number(cuenta.total);

      // 2. Crear división
      const division = await tx.cuentaDivision.create({
        data: {
          cuentaId: idCuenta,
          etiqueta: 'Pago Total',
          monto: montoCobrar,
        },
      });

      // 3. Crear pago independiente
      const pago = await tx.pago.create({
        data: {
          cuentaDivisionId: division.id,
          formaPago: formaPago || 'efectivo',
          monto: montoCobrar,
        },
      });

      // 4. Cerrar cuenta
      await tx.cuenta.update({
        where: { id: idCuenta },
        data: { cerradaEn: new Date() },
      });

      // 5. Liberar mesa
      if (cuenta.sesionMesaId) {
        await tx.sesionMesa.update({
          where: { id: cuenta.sesionMesaId },
          data: { estado: 'cerrada', cerradaEn: new Date() },
        });
      }

      return pago;
    });

    res.json({ ok: true, pago: resultado });
  } catch (error) {
    console.error('=== ERROR AL PROCESAR PAGO ===', error);
    res.status(500).json({
      error: 'Error al procesar el pago.',
      detalle: error.message,
    });
  }
};

// Atrapa cualquier forma en que el frontend intente enviar el pago
router.post('/', procesarCobroDirecto);
router.post('/pago', procesarCobroDirecto);
router.post('/cobrar', procesarCobroDirecto);
router.post('/:id', procesarCobroDirecto);
router.post('/:id/pago', procesarCobroDirecto);

module.exports = router;
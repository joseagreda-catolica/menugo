const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// GET /api/cuentas (o /api/cuentas?estado=pendiente)
router.get('/', async (req, res) => {
  try {
    const { estado } = req.query;
    const whereClause = estado === 'pendiente' || !estado ? { cerradaEn: null } : {};

    const cuentas = await prisma.cuenta.findMany({
      where: whereClause,
      include: {
        sesionMesa: {
          include: {
            mesa: true,
            mesero: { select: { id: true, nombreCompleto: true } },
          },
        },
      },
    });
    res.json(cuentas);
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({ error: 'Error al consultar las cuentas.' });
  }
});

// GET /api/cuentas/pendientes
router.get('/pendientes', async (req, res) => {
  try {
    const cuentas = await prisma.cuenta.findMany({
      where: { cerradaEn: null },
      include: {
        sesionMesa: {
          include: {
            mesa: true,
            mesero: { select: { id: true, nombreCompleto: true } },
          },
        },
      },
    });
    res.json(cuentas);
  } catch (error) {
    console.error('Error al obtener cuentas pendientes:', error);
    res.status(500).json({ error: 'Error al consultar las cuentas pendientes.' });
  }
});

// Lógica para procesar el pago de la cuenta
const procesarPago = async (req, res) => {
  try {
    const idCuenta = Number(req.params.id || req.body.cuentaId || req.body.id);
    const { formaPago, monto } = req.body;
    const montoFinal = Number(monto);

    if (isNaN(idCuenta)) {
      return res.status(400).json({ error: 'El ID de la cuenta no es válido.' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Verificar si hay un turno de caja abierto
      const corteActivo = await tx.corteCaja.findFirst({
        where: { cerradoEn: null },
      });

      const cuenta = await tx.cuenta.findUnique({
        where: { id: idCuenta },
      });

      if (!cuenta) {
        throw new Error('La cuenta no existe.');
      }

      const montoCobrar = !isNaN(montoFinal) && montoFinal > 0 ? montoFinal : Number(cuenta.total);

      // 2. Crear división del pago
      const division = await tx.cuentaDivision.create({
        data: {
          cuentaId: idCuenta,
          etiqueta: 'Pago Total',
          monto: montoCobrar,
        },
      });

      // 3. Crear pago asociando el corte de caja si existe
      const pago = await tx.pago.create({
        data: {
          cuentaDivisionId: division.id,
          formaPago: formaPago || 'efectivo',
          monto: montoCobrar,
          corteCajaId: corteActivo ? corteActivo.id : null, // 👈 Se vincula a la caja
        },
      });

      // 4. Cerrar la cuenta
      await tx.cuenta.update({
        where: { id: idCuenta },
        data: { cerradaEn: new Date() },
      });

      // 5. Liberar la mesa
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
    res.status(500).json({ error: 'Error al procesar el pago.', detalle: error.message });
  }
};

router.post('/:id/pagos', procesarPago);
router.post('/:id/pago', procesarPago);
router.post('/pago', procesarPago);
router.post('/pagos', procesarPago);

module.exports = router;
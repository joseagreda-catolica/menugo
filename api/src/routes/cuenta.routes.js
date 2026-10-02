const { Router } = require('express');
const prisma = require('../lib/prisma');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const AppError = require('../lib/AppError');
const cobroService = require('../services/cobro.service');

const router = Router();

// RF-28/RF-29: mesero solicita la cuenta, cajero la cobra.
router.use(requireAuth, requireRole('administrador', 'mesero', 'cajero'));

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

// Procesar el pago de la cuenta (la logica vive en cobro.service.js)
const procesarPago = async (req, res) => {
  try {
    const idCuenta = Number(req.params.id || req.body.cuentaId || req.body.id);

    if (isNaN(idCuenta)) {
      return res.status(400).json({ error: 'El ID de la cuenta no es válido.' });
    }

    const pago = await cobroService.cobrarCuenta({
      idCuenta,
      formaPago: req.body.formaPago,
      usuarioId: req.usuario.id,
    });

    res.json({ ok: true, pago });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    }
    console.error('=== ERROR AL PROCESAR PAGO ===', error);
    res.status(500).json({ error: 'Error al procesar el pago.', detalle: error.message });
  }
};

router.post('/:id/pagos', procesarPago);
router.post('/:id/pago', procesarPago);
router.post('/pago', procesarPago);
router.post('/pagos', procesarPago);

module.exports = router;
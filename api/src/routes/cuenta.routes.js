const { Router } = require('express');
const { z } = require('zod');
const prisma = require('../lib/prisma');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const AppError = require('../lib/AppError');
const cobroService = require('../services/cobro.service');
const divisionService = require('../services/division.service');

const router = Router();

// RF-28/RF-29: mesero solicita la cuenta, cajero la cobra.
router.use(requireAuth, requireRole('administrador', 'mesero', 'cajero'));

// Cobrar y dividir cuentas es trabajo del cajero (y del administrador).
const soloCaja = requireRole('administrador', 'cajero');

// Cada cuenta con su consumo (para dividir por platillos) y las partes en que se dividio (RF-22).
const INCLUDE_CUENTA = {
  sesionMesa: {
    include: {
      mesa: true,
      mesero: { select: { id: true, nombreCompleto: true } },
      pedidos: {
        where: { estado: { not: 'anulado' } },
        orderBy: { id: 'asc' },
        include: {
          lineas: {
            where: { estado: { not: 'anulada' } },
            orderBy: { id: 'asc' },
            include: { platillo: { select: { id: true, nombre: true } } },
          },
        },
      },
    },
  },
  divisiones: { orderBy: { id: 'asc' }, include: { pagos: true } },
};

const dividirSchema = z.discriminatedUnion('modo', [
  z.object({
    modo: z.literal('partes_iguales'),
    partes: z.number().int().min(2, 'Se necesitan al menos 2 partes.').max(20, 'El maximo es 20 partes.'),
  }),
  z.object({
    modo: z.literal('por_lineas'),
    grupos: z
      .array(
        z.object({
          etiqueta: z.string().max(40).optional(),
          lineaIds: z.array(z.number().int()).min(1, 'Cada comensal necesita al menos un platillo.'),
        })
      )
      .min(2, 'Se necesitan al menos 2 comensales.')
      .max(20, 'El maximo es 20 comensales.'),
  }),
]);

// Responde los errores esperados (AppError) con el formato estandar y registra el resto.
function responderError(res, error, contexto, mensaje) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }
  console.error(`=== ${contexto} ===`, error);
  return res.status(500).json({ error: mensaje, detalle: error.message });
}

// GET /api/cuentas (o /api/cuentas?estado=pendiente)
router.get('/', async (req, res) => {
  try {
    const { estado } = req.query;
    const whereClause = estado === 'pendiente' || !estado ? { cerradaEn: null } : {};

    const cuentas = await prisma.cuenta.findMany({ where: whereClause, include: INCLUDE_CUENTA });
    res.json(cuentas);
  } catch (error) {
    responderError(res, error, 'ERROR AL OBTENER CUENTAS', 'Error al consultar las cuentas.');
  }
});

// GET /api/cuentas/pendientes
router.get('/pendientes', async (req, res) => {
  try {
    const cuentas = await prisma.cuenta.findMany({
      where: { cerradaEn: null },
      orderBy: { creadaEn: 'asc' },
      include: INCLUDE_CUENTA,
    });
    res.json(cuentas);
  } catch (error) {
    responderError(res, error, 'ERROR AL OBTENER CUENTAS PENDIENTES', 'Error al consultar las cuentas pendientes.');
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
    responderError(res, error, 'ERROR AL PROCESAR PAGO', 'Error al procesar el pago.');
  }
};

router.post('/:id/pagos', soloCaja, procesarPago);
router.post('/:id/pago', soloCaja, procesarPago);
router.post('/pago', soloCaja, procesarPago);
router.post('/pagos', soloCaja, procesarPago);

// POST /api/cuentas/:id/dividir - RF-22: por partes iguales o asignando platillos
router.post('/:id/dividir', soloCaja, validate(dividirSchema), async (req, res) => {
  try {
    const idCuenta = Number(req.params.id);
    if (isNaN(idCuenta)) {
      return res.status(400).json({ error: 'El ID de la cuenta no es válido.' });
    }
    res.json({ ok: true, cuenta: await divisionService.dividir(idCuenta, req.body) });
  } catch (error) {
    responderError(res, error, 'ERROR AL DIVIDIR CUENTA', 'Error al dividir la cuenta.');
  }
});

// DELETE /api/cuentas/:id/division - deshace la division si todavia no hay pagos
router.delete('/:id/division', soloCaja, async (req, res) => {
  try {
    const idCuenta = Number(req.params.id);
    if (isNaN(idCuenta)) {
      return res.status(400).json({ error: 'El ID de la cuenta no es válido.' });
    }
    res.json({ ok: true, cuenta: await divisionService.cancelarDivision(idCuenta) });
  } catch (error) {
    responderError(res, error, 'ERROR AL CANCELAR DIVISION', 'Error al cancelar la división.');
  }
});

// POST /api/cuentas/:id/divisiones/:divisionId/pagos - cobra una parte de la cuenta
router.post('/:id/divisiones/:divisionId/pagos', soloCaja, async (req, res) => {
  try {
    const idCuenta = Number(req.params.id);
    const idDivision = Number(req.params.divisionId);
    if (isNaN(idCuenta) || isNaN(idDivision)) {
      return res.status(400).json({ error: 'El ID de la cuenta o de la parte no es válido.' });
    }

    const resultado = await cobroService.cobrarDivision({
      idCuenta,
      idDivision,
      formaPago: req.body.formaPago,
      usuarioId: req.usuario.id,
    });

    res.json({ ok: true, ...resultado });
  } catch (error) {
    responderError(res, error, 'ERROR AL COBRAR PARTE', 'Error al cobrar la parte de la cuenta.');
  }
});

module.exports = router;

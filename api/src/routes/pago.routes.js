const { Router } = require('express');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const AppError = require('../lib/AppError');
const cobroService = require('../services/cobro.service');

const router = Router();

// RF-28/RF-29: registrar un pago lo hace el cajero.
router.use(requireAuth, requireRole('administrador', 'cajero'));

const procesarCobroDirecto = async (req, res) => {
  try {
    const { cuentaId, id, formaPago } = req.body;
    const idCuenta = Number(req.params.id || cuentaId || id);

    if (isNaN(idCuenta)) {
      return res.status(400).json({ error: 'El ID de la cuenta no es válido.' });
    }

    const pago = await cobroService.cobrarCuenta({ idCuenta, formaPago, usuarioId: req.usuario.id });

    res.json({ ok: true, pago });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ error: { code: error.code, message: error.message } });
    }
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

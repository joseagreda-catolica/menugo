const { Router } = require('express');
const reporteController = require('../controllers/reporte.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');

const router = Router();

// RF-25 a RF-27: informacion de negocio, solo para administrador.
router.use(requireAuth, requireRole('administrador'));

router.get('/ventas', reporteController.ventas);
router.get('/ranking-platillos', reporteController.rankingPlatillos);
router.get('/distribucion-horaria', reporteController.distribucionPorFranja);

module.exports = router;

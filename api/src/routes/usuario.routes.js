const { Router } = require('express');
const usuarioController = require('../controllers/usuario.controller');
const requireAuth = require('../middlewares/auth.middleware');

const router = Router();

// Ejemplo de ruta protegida (RF-28): cualquier usuario autenticado puede ver
// su propia informacion. Sirve tambien como plantilla para las rutas de los
// modulos M1-M7 que se agregaran en las siguientes semanas.
router.get('/yo', requireAuth, usuarioController.yo);

module.exports = router;

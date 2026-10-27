const { Router } = require('express');
const { z } = require('zod');
const configuracionController = require('../controllers/configuracion.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');

const router = Router();

const actualizarSchema = z.object({
  umbralEsperaMin: z
    .number({ invalid_type_error: 'El umbral debe ser un numero.' })
    .int('El umbral debe ser un numero entero de minutos.')
    .min(1, 'El umbral minimo es 1 minuto.')
    .max(240, 'El umbral maximo es 240 minutos.'),
});

router.use(requireAuth);

// Lo leen las pantallas operativas; solo el administrador lo cambia (RF-20).
router.get('/', requireRole('administrador', 'mesero', 'cocinero', 'cajero'), configuracionController.obtener);
router.put('/', requireRole('administrador'), validate(actualizarSchema), configuracionController.actualizar);

module.exports = router;

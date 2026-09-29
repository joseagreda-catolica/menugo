const { Router } = require('express');
const { z } = require('zod');
const categoriaController = require('../controllers/categoria.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');

const router = Router();

const crearSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  descripcion: z.string().optional(),
  orden: z.number().int().optional(),
});

// RNF-10: no hay DELETE, desactivar es activa:false.
const actualizarSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  orden: z.number().int().optional(),
  activa: z.boolean().optional(),
});

// Todas las rutas exigen autenticación
router.use(requireAuth);

// GET: Lectura permitida para administrador, mesero, cocinero y cajero
router.get(
  '/',
  requireRole('administrador', 'mesero', 'cocinero', 'cajero'),
  categoriaController.listar
);

// POST y PATCH: Exclusivos para administrador
router.post(
  '/',
  requireRole('administrador'),
  validate(crearSchema),
  categoriaController.crear
);

router.patch(
  '/:id',
  requireRole('administrador'),
  validate(actualizarSchema),
  categoriaController.actualizar
);

module.exports = router;
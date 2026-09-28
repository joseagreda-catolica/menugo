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

router.use(requireAuth, requireRole('administrador'));

router.get('/', categoriaController.listar);
router.post('/', validate(crearSchema), categoriaController.crear);
router.patch('/:id', validate(actualizarSchema), categoriaController.actualizar);

module.exports = router;

const { Router } = require('express');
const { z } = require('zod');
const platilloController = require('../controllers/platillo.controller');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');

const router = Router();

const crearSchema = z.object({
  categoriaId: z.number().int(),
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  descripcion: z.string().optional(),
  precio: z.number().positive('El precio debe ser mayor a 0.'),
  fotoUrl: z.string().optional(),
  tiempoPreparacionMin: z.number().int().positive().optional(),
  orden: z.number().int().optional(),
});

const actualizarSchema = z.object({
  categoriaId: z.number().int().optional(),
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  precio: z.number().positive().optional(),
  fotoUrl: z.string().optional(),
  tiempoPreparacionMin: z.number().int().positive().optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

const disponibilidadSchema = z.object({
  disponible: z.boolean(),
});

router.use(requireAuth, requireRole('administrador'));

router.get('/', platilloController.listar);
router.post('/', validate(crearSchema), platilloController.crear);
router.patch('/:id', validate(actualizarSchema), platilloController.actualizar);
router.patch('/:id/disponibilidad', validate(disponibilidadSchema), platilloController.actualizarDisponibilidad);
router.post('/:id/imagen', upload.single('imagen'), platilloController.subirImagen);

module.exports = router;

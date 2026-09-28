const { Router } = require('express');
const { z } = require('zod');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Debe ser un correo valido.'),
  password: z.string().min(1, 'La contrasena es obligatoria.'),
});

router.post('/login', validate(loginSchema), authController.login);

module.exports = router;

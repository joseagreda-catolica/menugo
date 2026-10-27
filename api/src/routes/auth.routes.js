const { Router } = require('express');
const { z } = require('zod');
const { rateLimit } = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Debe ser un correo valido.'),
  password: z.string().min(1, 'La contrasena es obligatoria.'),
});

// Frena los intentos repetidos de adivinar una contrasena: solo cuentan los intentos
// fallidos, asi que el uso normal nunca se ve afectado. El limite se puede ajustar con
// LOGIN_MAX_INTENTOS; el contador vive en memoria y se reinicia al reiniciar el API.
const limitarIntentosFallidos = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.LOGIN_MAX_INTENTOS) || 30,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      error: {
        code: 'DEMASIADOS_INTENTOS',
        message: 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.',
      },
    }),
});

router.post('/login', limitarIntentosFallidos, validate(loginSchema), authController.login);

module.exports = router;

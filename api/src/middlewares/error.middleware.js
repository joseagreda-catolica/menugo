const { ZodError } = require('zod');
const AppError = require('../lib/AppError');

// Formato unico de error para toda la API (S2-07): evita que cada endpoint
// invente su propia forma de responder un fallo.
function errorMiddleware(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDACION',
        message: 'Los datos enviados no son validos.',
        detalles: err.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensaje: issue.message,
        })),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: { code: 'ERROR_INTERNO', message: 'Ocurrio un error inesperado.' },
  });
}

function notFoundMiddleware(req, res) {
  res.status(404).json({
    error: { code: 'NO_ENCONTRADO', message: `Ruta ${req.method} ${req.path} no existe.` },
  });
}

module.exports = { errorMiddleware, notFoundMiddleware };

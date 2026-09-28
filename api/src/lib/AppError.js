// Error de aplicacion con codigo HTTP explicito, para distinguir errores
// esperados (credenciales invalidas, recurso no encontrado) de bugs reales.
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = AppError;

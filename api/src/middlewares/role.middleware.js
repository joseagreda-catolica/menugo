const AppError = require('../lib/AppError');

// RF-29: cada endpoint declara que roles lo pueden llamar. Se usa despues de
// requireAuth, que ya dejo el rol del usuario en req.usuario.
function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return next(
        new AppError(403, 'SIN_PERMISO', 'Tu rol no tiene acceso a esta operacion.')
      );
    }
    next();
  };
}

module.exports = requireRole;

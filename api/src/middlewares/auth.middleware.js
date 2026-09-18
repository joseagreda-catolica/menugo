const jwt = require('jsonwebtoken');
const AppError = require('../lib/AppError');

// RF-28: toda funcion interna exige autenticacion. Lee el JWT del header
// Authorization: Bearer <token> y adjunta el usuario decodificado a req.usuario.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'NO_AUTENTICADO', 'Falta el token de autenticacion.'));
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(new AppError(401, 'TOKEN_INVALIDO', 'El token es invalido o expiro.'));
  }
}

module.exports = requireAuth;

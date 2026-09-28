const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../lib/AppError');
const usuarioRepository = require('../repositories/usuario.repository');

// RF-28 / RNF-06: valida credenciales contra el hash con sal y emite un JWT.
// El mismo mensaje de error se usa para email inexistente y contrasena
// incorrecta, para no revelar cual de los dos fallo.
async function login(email, password) {
  const usuario = await usuarioRepository.findByEmail(email);

  if (!usuario || !usuario.activo) {
    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contrasena incorrectos.');
  }

  const coincide = await bcrypt.compare(password, usuario.passwordHash);
  if (!coincide) {
    throw new AppError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contrasena incorrectos.');
  }

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombreCompleto },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nombreCompleto: usuario.nombreCompleto,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
}

module.exports = { login };

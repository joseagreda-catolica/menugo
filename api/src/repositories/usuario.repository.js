const prisma = require('../lib/prisma');

function findByEmail(email) {
  return prisma.usuario.findUnique({ where: { email } });
}

function findById(id) {
  return prisma.usuario.findUnique({ where: { id } });
}

module.exports = { findByEmail, findById };

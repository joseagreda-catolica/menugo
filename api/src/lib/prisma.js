const { PrismaClient } = require('@prisma/client');

// Cliente unico de Prisma para todo el proceso: evita agotar el pool de
// conexiones de PostgreSQL al recargar en desarrollo (nodemon).
const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

module.exports = prisma;

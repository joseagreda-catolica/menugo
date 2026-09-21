# MenúGo — API

Backend en Express 4 + Prisma + PostgreSQL. Arquitectura por capas: `routes` → `controllers` → `services` → `repositories`, con `middlewares` transversales (autenticación, autorización por rol, validación y manejo de errores).

## Requisitos

- Node.js 24 LTS
- Docker Desktop (para PostgreSQL en local)

## Cómo levantarlo

```bash
# desde la raíz del repositorio
cp .env.example .env
docker compose up -d

cd api
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

El servidor queda escuchando en `http://localhost:3000`.

## Estructura

```
src/
  app.js            # configuración de Express: middlewares y montaje de rutas
  server.js         # arranque del servidor HTTP
  routes/           # definición de endpoints por recurso
  controllers/      # reciben la request, llaman al service, arman la respuesta
  services/         # reglas de negocio
  repositories/     # acceso a datos vía Prisma (ninguna otra capa consulta Prisma directamente)
  middlewares/       # auth, autorización por rol, validación (Zod), manejo de errores
  lib/               # cliente de Prisma compartido
prisma/
  schema.prisma      # las 13 entidades del modelo de datos (ver /docs/modelo-datos.md)
  seed.js            # datos de prueba: restaurante ficticio de Santa Ana
```

## Variables de entorno

Ver `.env.example` en la raíz del repositorio.

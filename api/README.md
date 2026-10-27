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
cp ../.env .env   # Prisma CLI busca .env dentro de api/, no en la raíz
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

El servidor queda escuchando en `http://localhost:3000`. Usuarios de prueba y su contraseña en `prisma/seed.js` (todos: `menugo123`).

## Documentación del API

Con el servidor levantado, la documentación interactiva (Swagger UI) está en http://localhost:3000/api/docs y la especificación en [`openapi.yaml`](openapi.yaml). Describe las 36 operaciones con sus roles, errores y reglas de negocio. Se sirve desde el propio servidor, sin necesidad de internet.

## Pruebas

```bash
npm test            # pruebas unitarias (Vitest)
npm run test:e2e    # regresión completa por API (tests/regresion.mjs)
```

`test:e2e` necesita el API levantado y la base recién sembrada: crea pedidos, pagos y un cierre de caja reales. Para repetirla, vacía la base y vuelve a correr `npm run seed` (el comando está en el README de la raíz).

## Estructura

```
src/
  app.js            # configuración de Express: middlewares y montaje de rutas
  server.js         # arranque del servidor HTTP
  routes/           # definición de endpoints por recurso
  controllers/      # reciben la request, llaman al service, arman la respuesta
  services/         # reglas de negocio (cobro, división de cuentas, precios, reportes...)
  repositories/     # acceso a datos vía Prisma
  middlewares/      # auth, autorización por rol, validación (Zod), subida de archivos, errores
  lib/              # cliente de Prisma compartido y AppError
prisma/
  schema.prisma     # modelo de datos (ver /docs/modelo-datos.md)
  seed.js           # datos de prueba: restaurante ficticio de Santa Ana
  migrations/       # historial de cambios del esquema
tests/
  regresion.mjs     # regresión de punta a punta por API
openapi.yaml        # especificación OpenAPI
```

Deuda técnica conocida: las rutas de mesas, pedidos, cuentas y caja consultan Prisma directamente en lugar de pasar por repositorios. El cobro y la división de cuentas ya viven en servicios (`services/cobro.service.js`, `services/division.service.js`), que es el patrón a seguir al refactorizar el resto.

## Variables de entorno

Ver `.env.example` en la raíz del repositorio. Además:

| Variable | Para qué sirve | Por defecto |
|---|---|---|
| `JWT_SECRET` | Firma de los tokens. Usa un valor largo y aleatorio fuera de desarrollo | — |
| `JWT_EXPIRES_IN` | Duración de la sesión | `8h` |
| `LOGIN_MAX_INTENTOS` | Intentos de login fallidos permitidos por dirección cada 15 minutos | `30` |
| `CLOUDINARY_CLOUD_NAME` y relacionadas | Almacenamiento de fotos de platillos; sin ellas se guardan en `public/uploads` | — |

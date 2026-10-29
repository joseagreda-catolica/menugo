# MenúGo

Sistema web de gestión de pedidos y comandas para restaurantes y cafeterías pequeños: carta digital por código QR, toma de pedidos desde móvil, pantalla de cocina en tiempo real, mapa de mesas, cierre de cuenta/caja y reportes de venta.

Proyecto de ciclo para **Técnicas de Producción de Sistemas** — Facultad de Ingeniería y Arquitectura, Universidad Católica de El Salvador (UNICAES), Ciclo II 2026.

## Equipo

| Integrante | Carné | GitHub | Responsabilidad principal |
|---|---|---|---|
| José Neftalí Agreda Bolaños | 2016-AB-601 | [@joseagreda-catolica](https://github.com/joseagreda-catolica) | Análisis, backend y base de datos |
| Alex Eduardo Torrento Calderón | 2022-TC-650 | [@atorrento09](https://github.com/atorrento09) | Diseño de interfaz, frontend y pruebas |

Ambos integrantes participan en todas las etapas; la tabla indica solo la responsabilidad principal de cada uno.

**Docente:** Ma. Rafael Leonardo Jiménez Álvarez

## Stack técnico

- **Lenguaje:** JavaScript (ECMAScript 2022) en todo el stack, sobre Node.js 24 LTS<sup>[1](#nota-node)</sup>
- **Backend:** Express 4, arquitectura monolítica por capas (rutas → controladores → servicios → datos)
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Base de datos:** PostgreSQL 16 vía Prisma ORM
- **Actualización de cocina:** polling cada 3 segundos (no WebSockets — decisión documentada en la propuesta)
- **Control de versiones:** Git + GitHub, flujo con ramas `main`/`develop` y pull requests revisados

Detalle completo de la justificación tecnológica en la propuesta del sistema (Entregable 1).

<a name="nota-node"></a>`[1]` La propuesta (Entregable 1) especificó Node.js 20 LTS. Para el desarrollo se usa Node.js 24 LTS porque la versión 20 llegó a fin de soporte (EOL, abril 2026) antes del inicio del ciclo de desarrollo; ninguna otra decisión de arquitectura cambia por esto.

## Estado del proyecto

Sistema funcional de punta a punta: los 8 módulos de la propuesta y sus 30 requisitos funcionales están implementados y se verifican con una batería de regresión automática (ver [Pruebas](#pruebas)).

| Módulo | Qué hace |
|---|---|
| M1 Carta | Categorías y platillos con foto, descripción, tiempo de preparación, historial de precios, orden de presentación y marca de agotado |
| M2 Carta pública | Carta digital sin iniciar sesión, con búsqueda y filtro por categoría; se abre desde el QR de cada mesa |
| M3 Mesas | Mapa de salón con el estado y el tiempo de ocupación de cada mesa, administración de mesas y códigos QR descargables e imprimibles |
| M4 Pedidos | Toma de pedidos desde el celular; ver, cambiar, quitar o anular lo ya enviado; aviso al mesero cuando un platillo está listo |
| M5 Cocina | Comandas por mesa, de la más antigua a la más reciente, que se actualizan solas, con resaltado de las atrasadas |
| M6 Cobro | Efectivo, tarjeta u otro medio, división de la cuenta (partes iguales o por platillos) y corte de caja por turno |
| M7 Reportes | Ventas por rango de fechas, platillos más y menos vendidos, ventas por hora y por día de la semana |
| M8 Seguridad | Inicio de sesión, permisos por rol (administrador, mesero, cocinero, cajero), bitácora de acciones críticas y límite de intentos fallidos |

**Pendiente de verificar:** la prueba de usabilidad con tres personas (RNF-01), el funcionamiento en Firefox y Safari (RNF-02, solo se ha probado en Chrome/Edge) y poner en línea el despliegue gratuito (Render + Neon + Cloudinary), que ya está preparado: ver [docs/despliegue.md](docs/despliegue.md). Según la propuesta, la demostración puede ejecutarse en local.

El tablero de trabajo (134 tareas) vive en los [Issues](https://github.com/joseagreda-catolica/menugo/issues) y [Milestones](https://github.com/joseagreda-catolica/menugo/milestones); su fuente original y el script que las carga están en [`planificacion/`](planificacion/).

## Estructura del repositorio

```
api/            Backend (Express + Prisma + PostgreSQL). Ver api/README.md
web/            Frontend (React + Vite + Tailwind). Ver web/README.md
docs/           Modelo de datos, diccionario de datos, máquinas de estado y contratos
planificacion/  Tareas del proyecto y script de carga a GitHub
docker-compose.yml  PostgreSQL 16 para desarrollo
render.yaml     Despliegue gratuito en Render (ver docs/despliegue.md)
```

## Requisitos de entorno

- Node.js 24 LTS (ver nota sobre la versión más arriba)
- Docker Desktop (para levantar PostgreSQL en local)
- Git

## Cómo ejecutarlo

```bash
# 1. Base de datos (desde la raíz del repositorio)
cp .env.example .env
docker compose up -d

# 2. API
cd api
cp ../.env .env              # Prisma busca el .env dentro de api/
npm install
npx prisma migrate deploy    # crea las tablas
npm run seed                 # datos de demostración
npm run dev                  # http://localhost:3000

# 3. Frontend (en otra terminal)
cd web
npm install
npm run dev                  # http://localhost:5173
```

Abre http://localhost:5173 e inicia sesión con alguna de estas cuentas (la contraseña de todas es `menugo123`):

| Rol | Correo | Entra a |
|---|---|---|
| Administrador | admin@rinconsantaneco.com | Todo |
| Mesero | mesero@rinconsantaneco.com | Mapa de salón y toma de pedidos |
| Cocinero | cocinero@rinconsantaneco.com | Pantalla de cocina |
| Cajero | cajero@rinconsantaneco.com | Cobro y corte de caja |

La carta pública está en `/carta-publica` y no pide iniciar sesión. La documentación interactiva del API está en http://localhost:3000/api/docs.

Para dejar la base de datos de demostración como nueva (borra todos los pedidos, pagos y cambios):

```bash
docker exec menugo-db-1 psql -U menugo -d menugo -c "TRUNCATE TABLE bitacora, pago, cuenta_division, cuenta, pedido_linea, pedido, sesion_mesa, corte_caja, precio_historico, platillo, categoria, mesa, usuario, configuracion RESTART IDENTITY CASCADE;"
npm --prefix api run seed
```

## Uso desde un celular (carta por QR)

El frontend y el API escuchan en la red local, así que el celular de un cliente puede abrir la carta si está en la misma red que la computadora:

1. Averigua la IP de la computadora (`ipconfig` en Windows), por ejemplo `192.168.1.25`.
2. Entra como administrador a **Códigos QR** y en "Dirección pública del sistema" escribe `http://192.168.1.25:5173`. Los códigos se actualizan solos; descárgalos o imprímelos.
3. Si el celular no carga la página, permite a Node.js en el Firewall de Windows (red privada) los puertos 5173 y 3000.

## Pruebas

```bash
cd api
npm test            # pruebas unitarias (Vitest)
npm run test:e2e    # regresión completa por API: ~170 comprobaciones
```

La regresión necesita el API levantado y la base **recién sembrada** (ver arriba cómo dejarla como nueva); crea pedidos, pagos y un cierre de caja reales.

## Documentación

- [`docs/modelo-datos.md`](docs/modelo-datos.md) y [`docs/diccionario-datos.md`](docs/diccionario-datos.md): modelo entidad-relación y campo por campo.
- [`docs/maquinas-estado.md`](docs/maquinas-estado.md): estados de la sesión de mesa y de cada platillo del pedido, y quién puede cambiarlos.
- `api/openapi.yaml`: especificación OpenAPI del API (también en `/api/docs`).

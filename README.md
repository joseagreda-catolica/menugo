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

- **Lenguaje:** JavaScript (ECMAScript 2022) en todo el stack, sobre Node.js 20 LTS
- **Backend:** Express 4, arquitectura monolítica por capas (rutas → controladores → servicios → datos)
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Base de datos:** PostgreSQL 16 vía Prisma ORM
- **Actualización de cocina:** polling cada 3 segundos (no WebSockets — decisión documentada en la propuesta)
- **Control de versiones:** Git + GitHub, flujo con ramas `main`/`develop` y pull requests revisados

Detalle completo de la justificación tecnológica en la propuesta del sistema (Entregable 1).

## Estado del proyecto

En arranque (Bloque 0 / Semana 1). El tablero de trabajo completo (134 tareas, 8 módulos, cronograma de 8 semanas) vive en los [Issues](https://github.com/joseagreda-catolica/menugo/issues) y [Milestones](https://github.com/joseagreda-catolica/menugo/milestones) de este repositorio.

## Estructura del repositorio

Por definirse en la Semana 2: carpetas `api/` (Express) y `web/` (React), cada una con su propio `package.json`.

## Requisitos de entorno

- Node.js 20 LTS
- Docker Desktop (para levantar PostgreSQL en local)
- Git

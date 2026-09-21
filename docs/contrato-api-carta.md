# Contrato del API — Carta (M1, M2)

Este es el contrato que va a implementar el backend en la Semana 3 (S3-01 a S3-08). Se publica antes de terminar de construirlo para que el frontend (S3-10 a S3-16) pueda avanzar en paralelo contra esta misma forma de datos, usando datos mock mientras tanto, y el cambio de mock a real sea solo reemplazar la función que trae los datos — no rehacer componentes.

Nombres de campo iguales a `api/prisma/schema.prisma` (camelCase), para no repetir el desajuste de mayúsculas/minúsculas que rompió la autenticación.

## Autenticación

Todos los endpoints de administración requieren `Authorization: Bearer <token>` y rol `administrador`. El endpoint de carta pública no requiere autenticación.

## Categorías (M1)

```
GET /api/categorias
```
Requiere rol administrador. Devuelve todas las categorías (incluye inactivas, para poder reactivarlas).
```json
[
  { "id": 1, "nombre": "Entradas", "descripcion": null, "orden": 1, "activa": true }
]
```

```
POST /api/categorias
Body: { "nombre": "Entradas", "descripcion"?: string, "orden"?: number }
```
Devuelve la categoría creada (201).

```
PATCH /api/categorias/:id
Body (todos opcionales): { "nombre"?, "descripcion"?, "orden"?, "activa"? }
```
No existe DELETE — desactivar es `activa: false` (baja lógica, RNF-10).

## Platillos (M1)

```
GET /api/platillos
```
Requiere rol administrador. Devuelve todos los platillos con su precio vigente ya resuelto (no hace falta que el frontend calcule el historial).
```json
[
  {
    "id": 101,
    "categoriaId": 1,
    "nombre": "Nachos Supremos",
    "descripcion": "Totopos crujientes...",
    "fotoUrl": "https://res.cloudinary.com/.../nachos.jpg",
    "precio": 6.50,
    "tiempoPreparacionMin": 12,
    "disponible": true,
    "orden": 1,
    "activo": true
  }
]
```
Nota: el campo de la imagen se llama **`fotoUrl`**, no `imagen` (el mock actual en `MenuService.js` usa `imagen` — hay que renombrarlo).

```
POST /api/platillos
Body: { "categoriaId", "nombre", "descripcion"?, "precio", "fotoUrl"?, "tiempoPreparacionMin"?, "orden"? }
```
Crea el platillo y su primer registro de `precio_historico`. Devuelve el platillo con `precio` ya resuelto (201).

```
PATCH /api/platillos/:id
Body (todos opcionales): { "categoriaId"?, "nombre"?, "descripcion"?, "fotoUrl"?, "tiempoPreparacionMin"?, "orden"?, "activo"?, "precio"? }
```
Si el body incluye `precio` y es distinto al vigente, el backend cierra el precio anterior y abre uno nuevo automáticamente (RF-04) — el frontend no gestiona el historial, solo manda el precio nuevo.

```
PATCH /api/platillos/:id/disponibilidad
Body: { "disponible": boolean }
```
Endpoint separado y liviano a propósito, para el interruptor de "agotado" que pide S3-12 sin recargar la pantalla ni mandar el objeto completo.

```
POST /api/platillos/:id/imagen
Content-Type: multipart/form-data, campo "imagen"
```
Sube el archivo a Cloudinary (o al servidor si Cloudinary falla, según el riesgo R-07 de la propuesta) y devuelve `{ "fotoUrl": "..." }`. **Todavía no está implementado** — mientras tanto, el formulario de platillos puede seguir pidiendo la URL de la foto como texto, o dejar el campo vacío.

## Carta pública (M2)

```
GET /api/carta-publica?categoria=&buscar=
```
Sin autenticación. Solo categorías activas con al menos un platillo activo, y solo platillos activos (los agotados se incluyen pero marcados, no se ocultan — el comensal debe poder ver que existen pero no se pueden pedir).
```json
[
  {
    "id": 1,
    "nombre": "Entradas",
    "platillos": [
      { "id": 101, "nombre": "Nachos Supremos", "descripcion": "...", "fotoUrl": "...", "precio": 6.50, "disponible": true }
    ]
  }
]
```
`categoria` filtra por `id` de categoría; `buscar` filtra `platillos.nombre` por coincidencia parcial, sin distinguir mayúsculas/acentos (RF-08).

## Formato de error (ya vigente desde el login)

```json
{ "error": { "code": "NO_ENCONTRADO", "message": "..." } }
```
Y para validación (400): `{ "error": { "code": "VALIDACION", "message": "...", "detalles": [{ "campo", "mensaje" }] } }` — igual que ya se ve en `api/src/middlewares/error.middleware.js`.

## Qué implica esto para el trabajo ya hecho en el frontend

- `MenuService.js`: renombrar `imagen` → `fotoUrl` en el mock, y usar `id` numérico en vez de string, para que el día que se reemplace el mock por `fetch()` no haya que tocar los componentes que ya leen esos campos.
- `MenuAdmin.jsx` / `CategoriaModal.jsx` / `PlatilloModal.jsx`: el interruptor de disponibilidad (S3-12) puede ya simular la llamada a `PATCH /api/platillos/:id/disponibilidad` contra el mock, para que cuando el endpoint real exista solo se cambie la URL.
- `CartaPublica.jsx`: agrupar por categoría igual que la respuesta de arriba, para no tener que reestructurar el árbol de componentes después.

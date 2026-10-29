# Despliegue gratuito de MenúGo

El sistema corre en tres servicios con plan gratuito. Todos los dispositivos hablan con el mismo servidor y la misma base de datos, así que los datos se sincronizan solos (la cocina, el mapa y los avisos consultan al API cada pocos segundos).

| Pieza | Servicio | Qué guarda |
|---|---|---|
| API + frontend | [Render](https://render.com) (web service gratuito) | El API sirve también el frontend compilado: un solo dominio, sin CORS |
| Base de datos | [Neon](https://neon.com) (PostgreSQL) | Usuarios, mesas, carta, pedidos, cuentas y pagos |
| Fotos de platillos | [Cloudinary](https://cloudinary.com) | Imágenes subidas desde Platillos |

La base de datos **no** va en Render: su PostgreSQL gratuito se borra a los 30 días. Las fotos **no** van en el disco de Render: es efímero y se vacía al reiniciar.

## Límites del plan gratuito (verificados en octubre de 2026)

- **Render:** 750 horas de instancia al mes por cuenta (un servicio encendido todo el mes usa ~744). Tras 15 minutos sin visitas el servicio se duerme y la primera petición tarda cerca de 1 minuto en despertarlo.
- **Neon:** 0,5 GB de almacenamiento y 100 horas de cómputo al mes por proyecto. El cómputo se suspende solo tras 5 minutos sin consultas y despierta en menos de un segundo.
- **Cloudinary:** 25 créditos al mes (1 crédito = 1 GB de almacenamiento o de ancho de banda); sobra para unas decenas de fotos.

## Paso a paso

Los pasos 1 a 3 crean cuentas y manejan claves, por eso los hace una persona.

### 1. Base de datos en Neon

1. Entrar a neon.com con la cuenta de GitHub y crear un proyecto llamado `menugo` (región **AWS US East 2 (Ohio)**, la misma que Render).
2. En **Connect**, desactivar **Connection pooling** y copiar la cadena que empieza con `postgresql://`. Se usa la conexión directa porque las migraciones de Prisma no funcionan bien a través del *pooler*.

### 2. Fotos en Cloudinary

1. Crear una cuenta gratuita en cloudinary.com.
2. En el panel copiar **Cloud name**, **API Key** y **API Secret**.

### 3. Crear las tablas y los datos de demostración (una sola vez, desde tu computadora)

En PowerShell, dentro de la carpeta `api`:

```powershell
$env:DATABASE_URL = "la-cadena-de-neon"
$env:SEED_PASSWORD = "una-contraseña-que-elijas"
npx prisma migrate deploy
npm run seed
```

`SEED_PASSWORD` es la contraseña de los cuatro usuarios de prueba. Si se omite queda `menugo123`, que no conviene dejar en internet. Cerrar la ventana de PowerShell al terminar para que la cadena no quede guardada en la sesión.

### 4. Servicio en Render

1. Entrar a render.com con GitHub y elegir **New → Blueprint**.
2. Seleccionar el repositorio `menugo`. Render lee `render.yaml` y propone el servicio `menugo`.
3. Pegar los valores que pide: `DATABASE_URL` (Neon) y `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. `JWT_SECRET` lo genera Render solo.
4. **Apply**. La primera compilación tarda unos minutos y al terminar da una dirección `https://menugo-xxxx.onrender.com`.

### 5. Comprobar

- `https://TU-DIRECCION/api/health` responde `{"ok":true}`.
- Iniciar sesión con `admin@rinconsantaneco.com` y la contraseña elegida.
- Abrir el sistema desde el celular, tomar un pedido como mesero y verlo aparecer en la pantalla de cocina del computador.
- En **Platillos**, subir una foto y recargar: debe seguir ahí.

## Actualizar

Cada `git push` a la rama `develop` vuelve a desplegar solo. El build aplica las migraciones pendientes de Prisma. Cuando el proyecto se cierre, cambiar `branch` en `render.yaml` a `main`.

## Día de la demostración

- Abrir la dirección unos 2 minutos antes: si el servicio estaba dormido, así despierta sin que nadie espere frente al público. Mientras haya una pestaña abierta, las consultas periódicas lo mantienen despierto.
- Dejar pestañas abiertas toda la noche gasta horas de cómputo de Neon; cerrarlas al terminar.
- Los códigos QR de las mesas usan la dirección con la que se abrió el sistema. Imprimirlos desde la versión desplegada, no desde `localhost`.
- La base de la nube es independiente de la local: lo que se probó en tu computadora no aparece allá. Para empezar limpio basta con haber corrido el seed del paso 3.

## Probar el modo producción en local

```powershell
cd web
$env:VITE_API_URL = "/api"
npm run build
cd ../api
$env:NODE_ENV = "production"
$env:PORT = "3100"
node src/server.js
```

Abrir `http://localhost:3100`. (En Git Bash, anteponer `MSYS_NO_PATHCONV=1` al comando de build: sin eso Windows convierte `/api` en una ruta de disco.)

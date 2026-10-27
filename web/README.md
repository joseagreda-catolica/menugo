# MenúGo — Frontend

React 19 + Vite + Tailwind CSS v4. Se comunica con el API de `../api`.

## Cómo levantarlo

```bash
npm install
npm run dev      # http://localhost:5173 (también escucha en la red local)
npm run build    # compila para producción en dist/
npm run lint     # ESLint
```

## Dirección del API

Por defecto el frontend le habla al API del mismo equipo desde el que se abrió la página, en el puerto 3000 (`http://<servidor>:3000/api`), de modo que funciona igual en `localhost` y desde un celular que entra por la IP de la red local. Para apuntar a otro servidor, define `VITE_API_URL` al compilar (por ejemplo `VITE_API_URL=/api` si el API se sirve desde el mismo dominio). La lógica está en `src/config.js`.

## Estructura

```
src/
  pages/        # una pantalla por ruta (MapaSalon, TomaPedidos, Cocina, Cobro, CodigosQR...)
  components/   # piezas reutilizables: Layout, auth (rutas protegidas), pedidos, cocina, cobro
  Services/     # llamadas al API por módulo
  context/      # AuthContext: sesión, token y su vencimiento
  config.js     # dirección del API y de las fotos
```

## Diseño y comportamiento

- Responsivo desde 360 px: el menú lateral se oculta por debajo de 1024 px y se abre con el botón de hamburguesa.
- La sesión vive en el navegador (`localStorage`) y se cierra sola cuando el token vence. Con sesión iniciada no se puede volver al login, solo salir con "Cerrar Sesión".
- La pantalla de cocina se actualiza cada 3 s, el mapa de mesas cada 8 s y el pedido en curso cada 4 s.
- Los códigos QR se generan en el navegador con la dirección pública que se indique en la pantalla **Códigos QR**.

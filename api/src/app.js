const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const { errorMiddleware, notFoundMiddleware } = require('./middlewares/error.middleware');

const app = express();
const enProduccion = process.env.NODE_ENV === 'production';

// En produccion el API corre detras del proxy de la plataforma (Render). Sin esto todos
// los visitantes parecen venir de la misma IP y el limite de intentos de login los
// contaria juntos.
if (enProduccion) app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// Respaldo local de imagenes cuando Cloudinary no esta configurado (ver
// src/services/imagen.service.js y el riesgo R-07 de la propuesta).
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api', routes);

// Despliegue en un solo servicio: en produccion el API tambien sirve el frontend
// compilado (web/dist). Toda ruta sin extension que no sea /api ni /uploads devuelve
// index.html para que el enrutador de React resuelva la pantalla; un archivo con
// extension que no existe (por ejemplo un .js viejo) responde 404 como corresponde.
const CARPETA_WEB = path.join(__dirname, '../../web/dist');
if (enProduccion && fs.existsSync(path.join(CARPETA_WEB, 'index.html'))) {
  app.use(express.static(CARPETA_WEB));
  app.get(/^\/(?!api(\/|$)|uploads(\/|$))[^.]*$/, (req, res) =>
    res.sendFile(path.join(CARPETA_WEB, 'index.html'))
  );
}

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;

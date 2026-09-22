const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const { errorMiddleware, notFoundMiddleware } = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Respaldo local de imagenes cuando Cloudinary no esta configurado (ver
// src/services/imagen.service.js y el riesgo R-07 de la propuesta).
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api', routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;

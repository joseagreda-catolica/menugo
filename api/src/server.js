require('dotenv').config({ path: '../.env' });

// En produccion no hay archivo .env: las variables llegan de la plataforma. Si falta
// alguna, mejor fallar al arrancar con un mensaje claro que a media demostracion.
if (process.env.NODE_ENV === 'production') {
  const faltantes = ['DATABASE_URL', 'JWT_SECRET'].filter((nombre) => !process.env[nombre]);
  if (faltantes.length > 0) {
    console.error(`Faltan variables de entorno: ${faltantes.join(', ')}`);
    process.exit(1);
  }
  if (!require('./services/imagen.service').cloudinaryConfigurado) {
    console.warn('Cloudinary sin configurar: las fotos subidas se perderian al reiniciar el servidor.');
  }
}

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MenuGo API escuchando en http://localhost:${PORT}`);
});

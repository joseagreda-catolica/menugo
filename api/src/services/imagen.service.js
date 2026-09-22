const fs = require('fs/promises');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// R-07 (propuesta, seccion 9): si Cloudinary no esta disponible, se guarda
// en el propio servidor. Se decide una sola vez, al arrancar, segun si las
// credenciales estan configuradas.
const cloudinaryConfigurado = Boolean(process.env.CLOUDINARY_CLOUD_NAME);

if (cloudinaryConfigurado) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const CARPETA_LOCAL = path.join(__dirname, '../../public/uploads');

function subirACloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'menugo/platillos' },
      (error, resultado) => (error ? reject(error) : resolve(resultado.secure_url))
    );
    stream.end(buffer);
  });
}

async function guardarLocal(buffer, nombreOriginal) {
  await fs.mkdir(CARPETA_LOCAL, { recursive: true });
  const nombreUnico = `${Date.now()}-${nombreOriginal.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  await fs.writeFile(path.join(CARPETA_LOCAL, nombreUnico), buffer);
  return `/uploads/${nombreUnico}`;
}

function subir(buffer, nombreOriginal) {
  return cloudinaryConfigurado ? subirACloudinary(buffer) : guardarLocal(buffer, nombreOriginal);
}

module.exports = { subir, cloudinaryConfigurado };

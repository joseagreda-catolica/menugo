const multer = require('multer');
const AppError = require('../lib/AppError');

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

// En memoria, no en disco: imagen.service.js decide si termina en Cloudinary
// o en el disco local, el middleware no necesita saberlo.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) return cb(null, true);
    cb(new AppError(400, 'TIPO_ARCHIVO_INVALIDO', 'Solo se permiten imagenes JPG, PNG o WebP.'));
  },
});

module.exports = upload;

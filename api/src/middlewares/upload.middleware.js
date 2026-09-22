const multer = require('multer');

// En memoria, no en disco: imagen.service.js decide si termina en Cloudinary
// o en el disco local, el middleware no necesita saberlo.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;

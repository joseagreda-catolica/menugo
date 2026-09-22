const { Router } = require('express');
const cartaController = require('../controllers/carta.controller');

const router = Router();

// RF-06: sin autenticacion, a proposito.
router.get('/', cartaController.obtenerCartaPublica);

module.exports = router;

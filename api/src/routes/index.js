const { Router } = require('express');
const authRoutes = require('./auth.routes');
const usuarioRoutes = require('./usuario.routes');
const categoriaRoutes = require('./categoria.routes');
const platilloRoutes = require('./platillo.routes');
const cartaRoutes = require('./carta.routes');
const mesaRoutes = require('./mesa.routes');
const pedidoRoutes = require('./pedido.routes');
const cuentaRoutes = require('./cuenta.routes');
const cajaRoutes = require('./caja.routes');
const pagoRoutes = require('./pago.routes'); // 👈 1. Importar pago.routes.js

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/platillos', platilloRoutes);
router.use('/carta-publica', cartaRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/cuentas', cuentaRoutes);
router.use('/corte-caja', cajaRoutes);
router.use('/caja', cajaRoutes);

// 👈 2. Montar rutas de pago para responder a /api/pagos y /api/pago
router.use('/pagos', pagoRoutes);
router.use('/pago', pagoRoutes);

// Rutas de Mesas y Secciones
router.use('/', mesaRoutes);

module.exports = router;
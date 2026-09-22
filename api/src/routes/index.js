const { Router } = require('express');
const authRoutes = require('./auth.routes');
const usuarioRoutes = require('./usuario.routes');
const categoriaRoutes = require('./categoria.routes');
const platilloRoutes = require('./platillo.routes');
const cartaRoutes = require('./carta.routes');

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));
router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/platillos', platilloRoutes);
router.use('/carta-publica', cartaRoutes);

module.exports = router;

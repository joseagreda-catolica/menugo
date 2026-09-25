const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// ============================================================================
// 1. GET /api/pedidos - Consultar comandas para la Cocina (KDS)
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        lineas: {
          include: {
            platillo: true,
          },
        },
        sesionMesa: {
          include: {
            mesa: true,
          },
        },
        mesero: {
          select: {
            id: true,
            nombreCompleto: true,
          },
        },
      },
      orderBy: {
        abiertoEn: 'desc',
      },
    });

    res.json(pedidos);
  } catch (error) {
    console.error('=== ERROR EN GET /api/pedidos ===');
    console.error(error);

    res.status(500).json({
      error: 'Error al consultar las comandas de cocina.',
      detalle: error.message,
    });
  }
});

// ============================================================================
// 2. POST /api/pedidos - Registrar comanda desde TomaPedidos (POS)
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { mesaId, meseroId, lineas, items, platillos, productos, detalles, notas } = req.body;
    const idMesa = Number(mesaId);

    // Detección flexible de la lista de platillos del carrito
    const listaPlatillos = lineas || items || platillos || productos || detalles || [];

    if (isNaN(idMesa)) {
      return res.status(400).json({ error: 'El ID de la mesa no es válido.' });
    }

    if (!Array.isArray(listaPlatillos) || listaPlatillos.length === 0) {
      return res.status(400).json({ error: 'El pedido debe contener al menos un platillo.' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Obtener un mesero válido (meseroId es campo obligatorio en Pedido y SesionMesa)
      let idMeseroFinal = Number(meseroId);
      if (isNaN(idMeseroFinal)) {
        const usuarioExistente = await tx.usuario.findFirst({ where: { activo: true } });
        idMeseroFinal = usuarioExistente ? usuarioExistente.id : 1;
      }

      // 2. Buscar o crear la SesionMesa activa
      let sesionActiva = await tx.sesionMesa.findFirst({
        where: { mesaId: idMesa, cerradaEn: null },
      });

      if (!sesionActiva) {
        sesionActiva = await tx.sesionMesa.create({
          data: {
            mesaId: idMesa,
            meseroId: idMeseroFinal,
            estado: 'ocupada',
            abiertaEn: new Date(),
          },
        });
      } else {
        await tx.sesionMesa.update({
          where: { id: sesionActiva.id },
          data: { estado: 'pedido_en_curso' },
        });
      }

      // 3. Calcular el total del pedido actual
      const totalPedidoActual = listaPlatillos.reduce((acumulado, item) => {
        const cant = Number(item.cantidad || 1);
        const precio = Number(item.precioUnitario || item.precio || 0);
        return acumulado + cant * precio;
      }, 0);

      // 4. Crear o actualizar la Cuenta (asociada a sesionMesaId)
      let cuenta = await tx.cuenta.findFirst({
        where: { sesionMesaId: sesionActiva.id, cerradaEn: null },
      });

      if (!cuenta) {
        cuenta = await tx.cuenta.create({
          data: {
            sesionMesaId: sesionActiva.id,
            total: totalPedidoActual,
          },
        });
      } else {
        cuenta = await tx.cuenta.update({
          where: { id: cuenta.id },
          data: {
            total: Number(cuenta.total) + totalPedidoActual,
          },
        });
      }

      // 5. Crear el Pedido y sus líneas usando las columnas exactas del schema.prisma
      const nuevoPedido = await tx.pedido.create({
        data: {
          sesionMesaId: sesionActiva.id,
          meseroId: idMeseroFinal,
          estado: 'abierto',
          lineas: {
            create: listaPlatillos.map((linea) => ({
              platilloId: Number(linea.platilloId || linea.id || linea.productoId),
              cantidad: Number(linea.cantidad || 1),
              precioUnitario: Number(linea.precioUnitario || linea.precio || 0),
              notaPreparacion: String(linea.notaPreparacion || linea.notas || linea.nota || notas || '').substring(0, 200),
              estado: 'pendiente',
            })),
          },
        },
        include: {
          lineas: {
            include: {
              platillo: true,
            },
          },
          mesero: {
            select: {
              id: true,
              nombreCompleto: true,
            },
          },
        },
      });

      return { pedido: nuevoPedido, sesionMesa: sesionActiva, cuenta };
    });

    res.status(201).json({ ok: true, ...resultado });
  } catch (error) {
    console.error('=== ERROR AL REGISTRAR PEDIDO ===');
    console.error(error);

    res.status(500).json({
      error: 'Error interno al procesar el pedido.',
      detalle: error.message,
    });
  }
});

// ============================================================================
// 3. PATCH /api/pedidos/lineas/:id/estado - Actualizar estado de platillo (Cocina)
// ============================================================================
router.patch('/lineas/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // Valores válidos: 'pendiente', 'en_preparacion', 'listo', 'entregado', 'anulada'

    const lineaActualizada = await prisma.pedidoLinea.update({
      where: { id: Number(id) },
      data: { estado },
    });

    res.json({ ok: true, linea: lineaActualizada });
  } catch (error) {
    console.error('=== ERROR AL ACTUALIZAR LINEA ===', error);
    res.status(500).json({
      error: 'Error al cambiar el estado del platillo.',
      detalle: error.message,
    });
  }
});

// ============================================================================
// 4. PATCH /api/pedidos/:id/estado - Actualizar estado general de la comanda
// ============================================================================
router.patch('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // Valores válidos: 'abierto', 'cerrado', 'anulado'

    const pedidoActualizado = await prisma.pedido.update({
      where: { id: Number(id) },
      data: { estado },
    });

    res.json({ ok: true, pedido: pedidoActualizado });
  } catch (error) {
    console.error('=== ERROR AL ACTUALIZAR PEDIDO ===', error);
    res.status(500).json({
      error: 'Error al cambiar el estado del pedido.',
      detalle: error.message,
    });
  }
});

module.exports = router;
const { Router } = require('express');
const prisma = require('../lib/prisma');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const bitacoraService = require('../services/bitacora.service');
const AppError = require('../lib/AppError');

const router = Router();

// Maquina de estados de la linea de pedido (docs/maquinas-estado.md, RF-19): cada
// transicion permitida y los roles que pueden ejecutarla. Cualquier otra se rechaza.
const ESTADOS_LINEA = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'anulada'];
// listo -> entregado: el documento lo asigna al mesero, pero el unico boton que lo
// hace hoy esta en la pantalla de cocina, asi que el cocinero tambien puede.
const TRANSICIONES_LINEA = {
  pendiente: { en_preparacion: ['cocinero', 'administrador'], anulada: ['mesero', 'administrador'] },
  en_preparacion: { listo: ['cocinero', 'administrador'] },
  listo: { entregado: ['mesero', 'cocinero', 'administrador'] },
};

function responderAppError(res, error) {
  if (!(error instanceof AppError)) return false;
  res.status(error.status).json({ error: { code: error.code, message: error.message } });
  return true;
}

const redondear = (valor) => Number(valor.toFixed(2));

// RF-28/RF-29: mesero levanta pedidos, cocinero cambia el estado de preparacion.
router.use(requireAuth, requireRole('administrador', 'mesero', 'cocinero'));

// ============================================================================
// 1. GET /api/pedidos - Consultar comandas para la Cocina (KDS)
// ============================================================================
router.get('/', async (req, res) => {
  try {
    // Solo comandas vivas: pedidos abiertos de mesas que siguen atendidas. Las ya
    // cobradas o anuladas no deben seguir apareciendo en la pantalla de cocina.
    const pedidos = await prisma.pedido.findMany({
      where: { estado: 'abierto', sesionMesa: { cerradaEn: null } },
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
    const { mesaId, lineas, items, platillos, productos, detalles, notas } = req.body;
    const idMesa = Number(mesaId);

    // Detección flexible de la lista de platillos del carrito
    const listaPlatillos = lineas || items || platillos || productos || detalles || [];

    if (isNaN(idMesa)) {
      return res.status(400).json({ error: 'El ID de la mesa no es válido.' });
    }

    if (!Array.isArray(listaPlatillos) || listaPlatillos.length === 0) {
      return res.status(400).json({ error: 'El pedido debe contener al menos un platillo.' });
    }

    // Una cantidad negativa o fraccionaria restaria dinero de la cuenta.
    for (const item of listaPlatillos) {
      const idPlatillo = Number(item.platilloId || item.id || item.productoId);
      const cantidad = Number(item.cantidad || 1);
      if (!Number.isInteger(idPlatillo) || idPlatillo <= 0 || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
        return res.status(400).json({
          error: { code: 'LINEA_INVALIDA', message: 'Cada línea necesita un platillo válido y una cantidad entera entre 1 y 99.' },
        });
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // RNF-07: bloquea la fila de la mesa antes de leer su sesion activa, para
      // que dos meseros no puedan abrir la misma mesa al mismo tiempo (la
      // segunda transaccion espera aqui hasta que la primera confirme, y
      // entonces ve la sesion recien creada en vez de crear una duplicada).
      await tx.$queryRaw`SELECT id FROM mesa WHERE id = ${idMesa} FOR UPDATE`;

      // 1. El mesero del pedido es quien tiene la sesión iniciada, no un valor
      //    que mande el cliente (meseroId es obligatorio en Pedido y SesionMesa).
      const idMeseroFinal = req.usuario.id;

      // 2. Buscar o crear la SesionMesa activa
      let sesionActiva = await tx.sesionMesa.findFirst({
        where: { mesaId: idMesa, cerradaEn: null },
      });

      if (!sesionActiva) {
        sesionActiva = await tx.sesionMesa.create({
          data: {
            mesaId: idMesa,
            meseroId: idMeseroFinal,
            estado: 'pedido_en_curso',
            abiertaEn: new Date(),
          },
        });
      } else if (sesionActiva.estado === 'ocupada') {
        await tx.sesionMesa.update({
          where: { id: sesionActiva.id },
          data: { estado: 'pedido_en_curso' },
        });
      }

      // 2.5. Resolver el precio VIGENTE de cada platillo en el servidor
      // (RF-04): nunca se confia en un precio que mande el cliente, para que
      // un pedido conserve el precio real del momento en que se hizo.
      const idsPlatillos = [...new Set(listaPlatillos.map((l) => Number(l.platilloId || l.id || l.productoId)))];
      const preciosVigentes = await tx.precioHistorico.findMany({
        where: { platilloId: { in: idsPlatillos }, vigenteHasta: null },
      });
      const precioPorPlatillo = new Map(preciosVigentes.map((p) => [p.platilloId, Number(p.precio)]));

      // Un platillo inexistente, inactivo o sin precio vigente no se puede pedir (antes
      // entraba al pedido con precio $0), y uno agotado tampoco.
      const platillosPedidos = await tx.platillo.findMany({ where: { id: { in: idsPlatillos } } });
      const platilloPorId = new Map(platillosPedidos.map((p) => [p.id, p]));
      for (const idPlatillo of idsPlatillos) {
        const platillo = platilloPorId.get(idPlatillo);
        if (!platillo || !platillo.activo || !precioPorPlatillo.has(idPlatillo)) {
          throw new AppError(400, 'PLATILLO_NO_VALIDO', `El platillo ${idPlatillo} no existe o no tiene precio vigente.`);
        }
        if (!platillo.disponible) {
          throw new AppError(409, 'PLATILLO_AGOTADO', `${platillo.nombre} está agotado.`);
        }
      }

      // 3. Calcular el total del pedido actual con el precio resuelto arriba
      const totalPedidoActual = listaPlatillos.reduce((acumulado, item) => {
        const cant = Number(item.cantidad || 1);
        const platilloId = Number(item.platilloId || item.id || item.productoId);
        const precio = precioPorPlatillo.get(platilloId) || 0;
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
            create: listaPlatillos.map((linea) => {
              const platilloId = Number(linea.platilloId || linea.id || linea.productoId);
              return {
                platilloId,
                cantidad: Number(linea.cantidad || 1),
                precioUnitario: precioPorPlatillo.get(platilloId) || 0,
                notaPreparacion: String(linea.notaPreparacion || linea.notas || linea.nota || notas || '').substring(0, 200),
                estado: 'pendiente',
              };
            }),
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
    if (responderAppError(res, error)) return;
    console.error('=== ERROR AL REGISTRAR PEDIDO ===');
    console.error(error);

    res.status(500).json({
      error: 'Error interno al procesar el pedido.',
      detalle: error.message,
    });
  }
});

// ============================================================================
// 3. PATCH /api/pedidos/lineas/:id/estado - Cambiar estado de un platillo
//    Sigue la maquina de estados de docs/maquinas-estado.md: solo las
//    transiciones definidas, y solo por los roles que les corresponden.
// ============================================================================
router.patch('/lineas/:id/estado', async (req, res) => {
  try {
    const idLinea = Number(req.params.id);
    const { estado } = req.body;

    if (isNaN(idLinea)) {
      return res.status(400).json({ error: 'El ID de la línea no es válido.' });
    }
    if (!ESTADOS_LINEA.includes(estado)) {
      return res.status(400).json({ error: `El estado debe ser uno de: ${ESTADOS_LINEA.join(', ')}.` });
    }

    const lineaActualizada = await prisma.$transaction(async (tx) => {
      const actual = await tx.pedidoLinea.findUnique({ where: { id: idLinea }, include: { pedido: true } });
      if (!actual) {
        throw new AppError(404, 'LINEA_NO_ENCONTRADA', 'La línea no existe.');
      }

      const rolesPermitidos = TRANSICIONES_LINEA[actual.estado]?.[estado];
      if (!rolesPermitidos) {
        throw new AppError(409, 'TRANSICION_INVALIDA', `Una línea en estado ${actual.estado} no puede pasar a ${estado}.`);
      }
      if (!rolesPermitidos.includes(req.usuario.rol)) {
        throw new AppError(403, 'ROL_NO_PERMITIDO', `El rol ${req.usuario.rol} no puede hacer este cambio.`);
      }

      // RF-15: al retirar una linea pendiente, la cuenta abierta deja de cobrarla.
      if (estado === 'anulada') {
        await tx.$queryRaw`SELECT id FROM cuenta WHERE sesion_mesa_id = ${actual.pedido.sesionMesaId} FOR UPDATE`;
        const cuenta = await tx.cuenta.findFirst({ where: { sesionMesaId: actual.pedido.sesionMesaId, cerradaEn: null } });
        if (cuenta) {
          const descuento = actual.cantidad * Number(actual.precioUnitario);
          await tx.cuenta.update({
            where: { id: cuenta.id },
            data: { total: redondear(Math.max(0, Number(cuenta.total) - descuento)) },
          });
        }
      }

      return tx.pedidoLinea.update({ where: { id: idLinea }, data: { estado } });
    });

    res.json({ ok: true, linea: lineaActualizada });
  } catch (error) {
    if (responderAppError(res, error)) return;
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
    const { estado, motivo } = req.body; // Valores válidos: 'abierto', 'cerrado', 'anulado'
    const idPedido = Number(id);

    if (isNaN(idPedido)) {
      return res.status(400).json({ error: 'El ID del pedido no es válido.' });
    }
    if (!['abierto', 'cerrado', 'anulado'].includes(estado)) {
      return res.status(400).json({ error: 'El estado debe ser abierto, cerrado o anulado.' });
    }

    // RF-16: anular un pedido exige motivo y deja constancia de quien lo hizo.
    if (estado === 'anulado') {
      if (!motivo) {
        return res.status(400).json({ error: 'Anular un pedido requiere indicar el motivo.' });
      }

      const pedidoAnulado = await prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.findUnique({ where: { id: idPedido }, include: { lineas: true } });
        if (!pedido) {
          throw new AppError(404, 'PEDIDO_NO_ENCONTRADO', 'El pedido no existe.');
        }
        if (pedido.estado === 'anulado') {
          throw new AppError(409, 'PEDIDO_YA_ANULADO', 'El pedido ya estaba anulado.');
        }
        if (pedido.estado === 'cerrado') {
          throw new AppError(409, 'PEDIDO_COBRADO', 'El pedido ya fue cobrado y no se puede anular.');
        }

        // Un pedido anulado deja de cobrarse y de prepararse: se descuenta de la
        // cuenta abierta y sus platillos pasan a anulada (baja logica, RNF-10).
        const descuento = pedido.lineas
          .filter((l) => l.estado !== 'anulada')
          .reduce((acumulado, l) => acumulado + l.cantidad * Number(l.precioUnitario), 0);

        await tx.$queryRaw`SELECT id FROM cuenta WHERE sesion_mesa_id = ${pedido.sesionMesaId} FOR UPDATE`;
        const cuenta = await tx.cuenta.findFirst({ where: { sesionMesaId: pedido.sesionMesaId, cerradaEn: null } });
        if (cuenta && descuento > 0) {
          await tx.cuenta.update({
            where: { id: cuenta.id },
            data: { total: redondear(Math.max(0, Number(cuenta.total) - descuento)) },
          });
        }

        await tx.pedidoLinea.updateMany({
          where: { pedidoId: idPedido, estado: { not: 'anulada' } },
          data: { estado: 'anulada' },
        });

        return tx.pedido.update({
          where: { id: idPedido },
          data: { estado: 'anulado', motivoAnulacion: motivo, anuladoPor: req.usuario.id },
        });
      });

      await bitacoraService.registrar({
        usuarioId: req.usuario.id,
        accion: 'anulacion_pedido',
        entidad: 'pedido',
        entidadId: idPedido,
        detalle: { motivo },
      });

      return res.json({ ok: true, pedido: pedidoAnulado });
    }

    const pedidoActualizado = await prisma.pedido.update({
      where: { id: idPedido },
      data: { estado },
    });

    res.json({ ok: true, pedido: pedidoActualizado });
  } catch (error) {
    if (responderAppError(res, error)) return;
    console.error('=== ERROR AL ACTUALIZAR PEDIDO ===', error);
    res.status(500).json({
      error: 'Error al cambiar el estado del pedido.',
      detalle: error.message,
    });
  }
});

module.exports = router;
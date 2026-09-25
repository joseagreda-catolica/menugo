const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

// Función auxiliar para parsear el número de mesa
const parsearNumeroMesa = (valor) => {
  if (typeof valor === 'number') return Math.floor(valor);
  if (!valor) return null;
  const directo = parseInt(valor, 10);
  if (!isNaN(directo)) return directo;
  const coincidencia = String(valor).match(/\d+/);
  return coincidencia ? parseInt(coincidencia[0], 10) : null;
};

// Valores permitidos por el Enum EstadoSesionMesa de Prisma
const ESTADOS_SESION_VALIDOS = ['ocupada', 'pedido_en_curso', 'pendiente_cobro', 'cerrada'];

// Mapeo dinámico para convertir estados de frontend a valores permitidos en PostgreSQL
const mapearEstadoSesion = (estadoFrontend) => {
  if (!estadoFrontend) return 'ocupada';
  if (ESTADOS_SESION_VALIDOS.includes(estadoFrontend)) return estadoFrontend;
  if (estadoFrontend === 'cuenta_pedida') return 'pendiente_cobro';
  return 'ocupada'; // Valor seguro por defecto
};

// 1. GET /api/mesas - Obtiene las mesas y calcula su estado según la SesionMesa activa
router.get('/mesas', async (req, res) => {
  try {
    const [mesas, sesionesActivas] = await Promise.all([
      prisma.mesa.findMany({ orderBy: { numero: 'asc' } }),
      prisma.sesionMesa.findMany({
        where: { cerradaEn: null },
      }),
    ]);

    const mapaSesiones = new Map(sesionesActivas.map((s) => [s.mesaId, s]));

    const mesasMapeadas = mesas.map((m) => {
      const sesionActiva = mapaSesiones.get(m.id);

      return {
        id: m.id,
        numero: m.numero,
        capacidad: m.capacidad,
        ubicacion: m.ubicacion || 'Interior',
        seccion: m.ubicacion || 'Interior',
        activa: Boolean(m.activa),
        estado: sesionActiva ? sesionActiva.estado : 'libre',
        sesionId: sesionActiva ? sesionActiva.id : null,
      };
    });

    res.json(mesasMapeadas);
  } catch (error) {
    console.error('Error al consultar mesas:', error);
    res.status(500).json({ error: 'Error al consultar las mesas en la BD.', detalle: error.message });
  }
});

// 2. GET /api/secciones
router.get('/secciones', async (req, res) => {
  try {
    res.json([
      { id: 1, nombre: 'Interior' },
      { id: 2, nombre: 'Terraza' },
      { id: 3, nombre: 'VIP' },
      { id: 4, nombre: 'Barra' },
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener secciones.' });
  }
});

// 3. POST /api/mesas - Crear nueva Mesa
router.post('/mesas', async (req, res) => {
  try {
    const { numero, capacidad, ubicacion, seccion, activa } = req.body;

    const numeroInt = parsearNumeroMesa(numero);
    if (numeroInt === null || isNaN(numeroInt)) {
      return res.status(400).json({
        error: 'El número de mesa debe ser un número entero válido.',
      });
    }

    const nuevaMesa = await prisma.mesa.create({
      data: {
        numero: numeroInt,
        capacidad: Number(capacidad) || 4,
        ubicacion: String(ubicacion || seccion || 'Interior').trim(),
        activa: typeof activa === 'boolean' ? activa : true,
      },
    });

    res.status(201).json({
      ...nuevaMesa,
      seccion: nuevaMesa.ubicacion,
      estado: 'libre',
    });
  } catch (error) {
    console.error('Error al crear mesa:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: `Ya existe una mesa con el número "${req.body.numero}".`,
      });
    }
    res.status(500).json({ error: 'Error interno al guardar la mesa.', detalle: error.message });
  }
});

// 4. PUT /api/mesas/:id - Actualiza datos de la mesa y crea/cierra/actualiza la SesionMesa
router.put('/mesas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { numero, capacidad, ubicacion, seccion, activa, estado, meseroId, numComensales } = req.body;

    const idMesa = Number(id);
    if (isNaN(idMesa)) {
      return res.status(400).json({ error: 'ID de mesa no válido.' });
    }

    // Actualizar campos propios de la tabla 'mesa'
    const dataAActualizar = {};
    if (numero !== undefined) {
      const numeroInt = parsearNumeroMesa(numero);
      if (numeroInt !== null) dataAActualizar.numero = numeroInt;
    }
    if (capacidad !== undefined) dataAActualizar.capacidad = Number(capacidad);
    if (ubicacion !== undefined || seccion !== undefined) {
      dataAActualizar.ubicacion = String(ubicacion || seccion).trim();
    }
    if (activa !== undefined) dataAActualizar.activa = Boolean(activa);

    let mesaActualizada = await prisma.mesa.findUnique({ where: { id: idMesa } });

    if (!mesaActualizada) {
      return res.status(404).json({ error: 'La mesa solicitada no existe.' });
    }

    if (Object.keys(dataAActualizar).length > 0) {
      mesaActualizada = await prisma.mesa.update({
        where: { id: idMesa },
        data: dataAActualizar,
      });
    }

    // Lógica para gestionar la SesionMesa de forma segura
    if (estado !== undefined) {
      const sesionActiva = await prisma.sesionMesa.findFirst({
        where: { mesaId: idMesa, cerradaEn: null },
      });

      if (estado === 'libre') {
        // Al liberar la mesa, se cierra la sesión marcando cerradaEn y el enum 'cerrada'
        if (sesionActiva) {
          await prisma.sesionMesa.update({
            where: { id: sesionActiva.id },
            data: { 
              cerradaEn: new Date(),
              estado: 'cerrada',
            },
          });
        }
      } else {
        const estadoEnum = mapearEstadoSesion(estado);

        if (sesionActiva) {
          // Si existe sesión abierta, se actualiza al enum correspondiente
          await prisma.sesionMesa.update({
            where: { id: sesionActiva.id },
            data: { estado: estadoEnum },
          });
        } else {
          // Si no existe, buscamos un mesero válido existente si el enviado no es válido
          let idMeseroFinal = Number(meseroId);
          if (isNaN(idMeseroFinal)) {
            const usuarioExistente = await prisma.usuario.findFirst({ where: { activo: true } });
            if (!usuarioExistente) {
              return res.status(400).json({ error: 'No existen usuarios en la base de datos para asignar la sesión.' });
            }
            idMeseroFinal = usuarioExistente.id;
          }

          await prisma.sesionMesa.create({
            data: {
              mesaId: idMesa,
              meseroId: idMeseroFinal,
              estado: estadoEnum,
              abiertaEn: new Date(),
              numComensales: numComensales ? Number(numComensales) : null,
            },
          });
        }
      }
    }

    // Consulta el estado final para sincronizar con la interfaz
    const sesionFinal = await prisma.sesionMesa.findFirst({
      where: { mesaId: idMesa, cerradaEn: null },
    });

    res.json({
      ...mesaActualizada,
      seccion: mesaActualizada.ubicacion,
      estado: sesionFinal ? sesionFinal.estado : 'libre',
      sesionId: sesionFinal ? sesionFinal.id : null,
    });
  } catch (error) {
    console.error('Error al actualizar mesa/sesión:', error);
    res.status(500).json({
      error: 'Error interno al actualizar la mesa o su sesión.',
      detalle: error.message,
    });
  }
});

// 5. DELETE /api/mesas/:id
router.delete('/mesas/:id', async (req, res) => {
  try {
    const idMesa = Number(req.params.id);
    await prisma.mesa.delete({ where: { id: idMesa } });
    res.json({ ok: true, mensaje: 'Mesa eliminada.' });
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    res.status(500).json({ error: 'No se pudo eliminar la mesa.', detalle: error.message });
  }
});

module.exports = router;
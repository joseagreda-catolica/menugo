const { Router } = require('express');
const prisma = require('../lib/prisma');
const requireAuth = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/role.middleware');
const bitacoraService = require('../services/bitacora.service');

const router = Router();

// RF-28/RF-29: el corte de caja lo maneja el cajero.
router.use(requireAuth, requireRole('administrador', 'cajero'));

// Handler principal para obtener el resumen de caja activo
const obtenerCorteActual = async (req, res) => {
  try {
    // 1. Buscar el LÚLTIMO turno de caja abierto
    let corteActivo = await prisma.corteCaja.findFirst({
      where: { cerradoEn: null },
      orderBy: { id: 'desc' },
    });

    // 2. Si no hay turno abierto, lo crea automáticamente para no perder cobros
    if (!corteActivo) {
      corteActivo = await prisma.corteCaja.create({
        data: {
          cajeroId: req.usuario.id,
          turnoFecha: new Date(),
          abiertoEn: new Date(),
        },
      });
    }

    // 3. Rescate: Vincular a este turno activo cualquier pago huérfano
    await prisma.pago.updateMany({
      where: { corteCajaId: null },
      data: { corteCajaId: corteActivo.id },
    });

    // 4. Consultar el turno con sus pagos cargados
    const corteConPagos = await prisma.corteCaja.findUnique({
      where: { id: corteActivo.id },
      include: {
        cajero: {
          select: { id: true, nombreCompleto: true, email: true },
        },
        pagos: {
          include: {
            cuentaDivision: {
              include: {
                cuenta: {
                  include: {
                    sesionMesa: {
                      include: { mesa: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 5. Sumatoria insensible a mayúsculas/minúsculas
    let efec = 0;
    let tarj = 0;
    let otro = 0;

    (corteConPagos.pagos || []).forEach((pago) => {
      const monto = Number(pago.monto || 0);
      const forma = String(pago.formaPago || '').toLowerCase();

      if (forma.includes('efectivo')) {
        efec += monto;
      } else if (forma.includes('tarjeta') || forma.includes('debito') || forma.includes('credito')) {
        tarj += monto;
      } else {
        otro += monto;
      }
    });

    const totalGen = efec + tarj + otro;

    console.log(`\n=== DATOS CAJA ACTUAL (ID: ${corteConPagos.id}) ===`);
    console.log(`Pagos en turno: ${corteConPagos.pagos.length}`);
    console.log(`Efectivo: $${efec} | Tarjeta: $${tarj} | Otros: $${otro} | Total: $${totalGen}\n`);

    // 6. Mapeo multivariable para asegurar compatibilidad con el frontend
    res.json({
      ...corteConPagos,
      // Efectivo
      totalEfectivo: efec,
      efectivo: efec,
      total_efectivo: efec,
      // Tarjeta
      totalTarjeta: tarj,
      tarjeta: tarj,
      total_tarjeta: tarj,
      // Otros métodos
      totalOtro: otro,
      totalOtros: otro,
      otros: otro,
      otrosMetodos: otro,
      total_otros: otro,
      // Total general
      totalGeneral: totalGen,
      total: totalGen,
      totalAcumulado: totalGen,
      total_general: totalGen,
    });
  } catch (error) {
    console.error('=== ERROR AL OBTENER CORTE ACTUAL ===', error);
    res.status(500).json({ error: 'Error al consultar corte.', detalle: error.message });
  }
};

router.get('/actual', obtenerCorteActual);
router.get('/activo', obtenerCorteActual);
router.get('/', obtenerCorteActual);

// POST /api/corte-caja/abrir
router.post('/abrir', async (req, res) => {
  try {
    const corteExistente = await prisma.corteCaja.findFirst({
      where: { cerradoEn: null },
      orderBy: { id: 'desc' },
    });

    if (corteExistente) {
      return res.status(400).json({ error: 'Ya existe un turno de caja abierto.' });
    }

    const nuevoCorte = await prisma.corteCaja.create({
      data: {
        cajeroId: req.usuario.id,
        turnoFecha: new Date(),
        abiertoEn: new Date(),
      },
      include: {
        cajero: { select: { id: true, nombreCompleto: true } },
      },
    });

    res.status(201).json({ ok: true, ...nuevoCorte });
  } catch (error) {
    console.error('=== ERROR AL ABRIR CAJA ===', error);
    res.status(500).json({ error: 'Error al abrir la caja.', detalle: error.message });
  }
});

// POST /api/corte-caja/cerrar
router.post('/cerrar', async (req, res) => {
  try {
    const corteActivo = await prisma.corteCaja.findFirst({
      where: { cerradoEn: null },
      orderBy: { id: 'desc' },
      include: { pagos: true },
    });

    if (!corteActivo) {
      return res.status(400).json({ error: 'No hay ningún turno de caja abierto para cerrar.' });
    }

    let efec = 0;
    let tarj = 0;
    let otro = 0;

    (corteActivo.pagos || []).forEach((pago) => {
      const monto = Number(pago.monto || 0);
      const forma = String(pago.formaPago || '').toLowerCase();

      if (forma.includes('efectivo')) efec += monto;
      else if (forma.includes('tarjeta') || forma.includes('debito') || forma.includes('credito')) tarj += monto;
      else otro += monto;
    });

    const corteCerrado = await prisma.corteCaja.update({
      where: { id: corteActivo.id },
      data: {
        cerradoEn: new Date(),
        totalEfectivo: efec,
        totalTarjeta: tarj,
        totalOtro: otro,
        totalGeneral: efec + tarj + otro,
      },
    });

    // RF-30: el cierre de caja queda registrado en bitacora.
    await bitacoraService.registrar({
      usuarioId: req.usuario.id,
      accion: 'cierre_caja',
      entidad: 'corte_caja',
      entidadId: corteCerrado.id,
      detalle: { totalEfectivo: efec, totalTarjeta: tarj, totalOtro: otro, totalGeneral: efec + tarj + otro },
    });

    res.json({ ok: true, ...corteCerrado });
  } catch (error) {
    console.error('=== ERROR AL CERRAR CAJA ===', error);
    res.status(500).json({ error: 'Error al cerrar la caja.', detalle: error.message });
  }
});

module.exports = router;
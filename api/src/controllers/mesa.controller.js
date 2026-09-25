const prisma = require('../lib/prisma');

const obtenerMesas = async (req, res, next) => {
  try {
    const mesas = await prisma.mesa.findMany();
    res.json(mesas);
  } catch (error) {
    next(error);
  }
};

const obtenerSecciones = async (req, res, next) => {
  try {
    const secciones = await prisma.seccion.findMany();
    res.json(secciones);
  } catch (error) {
    next(error);
  }
};

const crearMesa = async (req, res, next) => {
  try {
    const nuevaMesa = await prisma.mesa.create({
      data: req.body,
    });
    res.status(201).json(nuevaMesa);
  } catch (error) {
    next(error);
  }
};

const actualizarMesa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mesaActualizada = await prisma.mesa.update({
      where: { id: Number(id) },
      data: req.body,
    });
    res.json(mesaActualizada);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerMesas,
  obtenerSecciones,
  crearMesa,
  actualizarMesa,
};
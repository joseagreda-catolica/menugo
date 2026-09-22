const categoriaRepository = require('../repositories/categoria.repository');
const platilloRepository = require('../repositories/platillo.repository');
const platilloService = require('./platillo.service');

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// RF-06/RF-07/RF-08: publica, sin autenticacion. Los platillos agotados se
// incluyen marcados (disponible:false), no se ocultan -- el comensal debe
// poder verlos, solo no pedirlos.
async function obtenerCartaPublica({ categoriaId, buscar } = {}) {
  const [categorias, platillos] = await Promise.all([
    categoriaRepository.findAll(),
    platilloRepository.findAll(),
  ]);

  const buscarNormalizado = buscar ? normalizar(buscar) : null;

  const platillosVisibles = platillos
    .filter((p) => p.activo)
    .filter((p) => !categoriaId || p.categoriaId === categoriaId)
    .filter((p) => !buscarNormalizado || normalizar(p.nombre).includes(buscarNormalizado))
    .map(platilloService.mapear);

  return categorias
    .filter((c) => c.activa)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      platillos: platillosVisibles.filter((p) => p.categoriaId === c.id),
    }))
    .filter((c) => c.platillos.length > 0);
}

module.exports = { obtenerCartaPublica };

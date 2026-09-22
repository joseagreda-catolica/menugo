// Inyeccion de dependencia simple (en vez de importar el repositorio
// directamente) para que el servicio se pueda probar con un repositorio
// falso sin necesidad de mockear modulos de Node (ver __tests__).
function crearPrecioService(precioHistoricoRepository) {
  // RF-04: al cambiar el precio de un platillo se cierra la vigencia del
  // anterior y se abre una nueva. pedido_linea copia precioUnitario al
  // agregarse (ver docs/diccionario-datos.md), asi que un pedido ya tomado
  // nunca cambia de precio aunque el platillo suba despues -- esta funcion
  // solo se encarga de que exista siempre un unico precio vigente.
  async function actualizarPrecio(platilloId, nuevoPrecio) {
    const vigente = await precioHistoricoRepository.findVigente(platilloId);

    if (vigente && Number(vigente.precio) === Number(nuevoPrecio)) {
      return vigente;
    }

    if (vigente) {
      await precioHistoricoRepository.cerrarVigente(platilloId);
    }

    return precioHistoricoRepository.crear(platilloId, nuevoPrecio);
  }

  function obtenerVigente(platilloId) {
    return precioHistoricoRepository.findVigente(platilloId);
  }

  return { actualizarPrecio, obtenerVigente };
}

module.exports = crearPrecioService(require('../repositories/precioHistorico.repository'));
module.exports.crearPrecioService = crearPrecioService;

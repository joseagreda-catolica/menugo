const configuracionRepository = require('../repositories/configuracion.repository');

const CLAVE_UMBRAL_ESPERA = 'umbral_espera_min';
const UMBRAL_ESPERA_POR_DEFECTO = 15;

// RF-20: minutos que una comanda puede esperar en cocina antes de destacarse.
async function obtener() {
  const registro = await configuracionRepository.findByClave(CLAVE_UMBRAL_ESPERA);
  const valor = registro ? Number(registro.valor) : UMBRAL_ESPERA_POR_DEFECTO;
  return { umbralEsperaMin: Number.isFinite(valor) ? valor : UMBRAL_ESPERA_POR_DEFECTO };
}

async function actualizar({ umbralEsperaMin }) {
  await configuracionRepository.upsert(CLAVE_UMBRAL_ESPERA, String(umbralEsperaMin));
  return obtener();
}

module.exports = { obtener, actualizar, UMBRAL_ESPERA_POR_DEFECTO };

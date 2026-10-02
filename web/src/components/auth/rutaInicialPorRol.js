// Primera pantalla de cada rol: la que su rol realmente puede abrir.
const RUTA_INICIAL_POR_ROL = {
  administrador: '/mapa-salon',
  mesero: '/mapa-salon',
  cocinero: '/cocina',
  cajero: '/cobro',
}

export function rutaInicialPorRol(rol) {
  return RUTA_INICIAL_POR_ROL[rol?.toLowerCase()] || '/mapa-salon'
}

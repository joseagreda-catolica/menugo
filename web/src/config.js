// Direccion del API. Se puede fijar al compilar con VITE_API_URL (por ejemplo "/api"
// si el API se sirve desde el mismo dominio); si no, se usa el mismo servidor desde el
// que se abrio la pagina, puerto 3000. Asi funciona igual en localhost y desde un
// celular que entra por la IP de la red local.
export const API_URL =
  import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000/api`

const ORIGEN_API = API_URL.replace(/\/api\/?$/, '')

// Las fotos subidas sin Cloudinary se guardan como "/uploads/archivo.png" en el API:
// hay que pedirlas al API y no al servidor del frontend.
export function resolverFoto(url) {
  if (!url) return ''
  if (/^(https?:|blob:|data:)/i.test(url)) return url
  return `${ORIGEN_API}${url}`
}

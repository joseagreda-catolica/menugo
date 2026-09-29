const API_URL = 'http://localhost:3000/api'

function headersConAuth(extra = {}) {
  const token = localStorage.getItem('menugo_token')
  return { ...extra, Authorization: `Bearer ${token}` }
}

async function manejarRespuesta(res) {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || data.error || 'Ocurrio un error inesperado.')
  return data
}

export async function obtenerPedidos() {
  const res = await fetch(`${API_URL}/pedidos`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

export async function crearPedido(mesaId, lineas) {
  // lineas: [{ platilloId, cantidad, notaPreparacion }] -- SIN precio, el servidor lo resuelve solo
  const res = await fetch(`${API_URL}/pedidos`, {
    method: 'POST',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ mesaId, lineas }),
  })
  return manejarRespuesta(res)
}

export async function actualizarEstadoLinea(lineaId, estado) {
  const res = await fetch(`${API_URL}/pedidos/lineas/${lineaId}/estado`, {
    method: 'PATCH',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ estado }),
  })
  return manejarRespuesta(res)
}
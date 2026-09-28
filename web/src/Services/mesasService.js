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

export async function obtenerMesas() {
  const res = await fetch(`${API_URL}/mesas`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

export async function liberarMesa(id) {
  const res = await fetch(`${API_URL}/mesas/${id}`, {
    method: 'PUT',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ estado: 'libre' }),
  })
  return manejarRespuesta(res)
}
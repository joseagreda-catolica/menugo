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

function construirQuery({ desde, hasta } = {}) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function obtenerVentas(rango) {
  const res = await fetch(`${API_URL}/reportes/ventas${construirQuery(rango)}`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

export async function obtenerRankingPlatillos(rango) {
  const res = await fetch(`${API_URL}/reportes/ranking-platillos${construirQuery(rango)}`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

export async function obtenerDistribucionHoraria(rango) {
  const res = await fetch(`${API_URL}/reportes/distribucion-horaria${construirQuery(rango)}`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

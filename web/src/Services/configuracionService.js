import { API_URL } from '@/config'

function headersConAuth(extra = {}) {
  const token = localStorage.getItem('menugo_token')
  return { ...extra, Authorization: `Bearer ${token}` }
}

async function manejarRespuesta(res) {
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || data.error || 'Ocurrio un error inesperado.')
  return data
}

// RF-20: minutos de espera que destacan una comanda en la pantalla de cocina.
export async function obtenerConfiguracion() {
  const res = await fetch(`${API_URL}/configuracion`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

export async function guardarUmbralEspera(umbralEsperaMin) {
  const res = await fetch(`${API_URL}/configuracion`, {
    method: 'PUT',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ umbralEsperaMin }),
  })
  return manejarRespuesta(res)
}

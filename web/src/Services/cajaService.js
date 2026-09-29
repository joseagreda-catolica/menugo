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

export async function obtenerCuentasPendientes() {
  const res = await fetch(`${API_URL}/cuentas/pendientes`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

export async function registrarPago(cuentaId, formaPago, monto) {
  const res = await fetch(`${API_URL}/cuentas/${cuentaId}/pagos`, {
    method: 'POST',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ formaPago, monto }),
  })
  return manejarRespuesta(res)
}

export async function obtenerCorteActual() {
  const res = await fetch(`${API_URL}/corte-caja/actual`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

export async function cerrarCaja() {
  const res = await fetch(`${API_URL}/corte-caja/cerrar`, { method: 'POST', headers: headersConAuth() })
  return manejarRespuesta(res)
}
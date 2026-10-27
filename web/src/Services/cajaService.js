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

export async function obtenerCuentasPendientes() {
  const res = await fetch(`${API_URL}/cuentas/pendientes`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

// El monto lo calcula el servidor a partir de la cuenta; aqui solo se elige la forma de pago.
export async function registrarPago(cuentaId, formaPago) {
  const res = await fetch(`${API_URL}/cuentas/${cuentaId}/pagos`, {
    method: 'POST',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ formaPago }),
  })
  return manejarRespuesta(res)
}

// RF-22: datos = { modo: 'partes_iguales', partes } o { modo: 'por_lineas', grupos: [{ lineaIds }] }
export async function dividirCuenta(cuentaId, datos) {
  const res = await fetch(`${API_URL}/cuentas/${cuentaId}/dividir`, {
    method: 'POST',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(datos),
  })
  return manejarRespuesta(res)
}

export async function cancelarDivisionCuenta(cuentaId) {
  const res = await fetch(`${API_URL}/cuentas/${cuentaId}/division`, {
    method: 'DELETE',
    headers: headersConAuth(),
  })
  return manejarRespuesta(res)
}

export async function registrarPagoParte(cuentaId, divisionId, formaPago) {
  const res = await fetch(`${API_URL}/cuentas/${cuentaId}/divisiones/${divisionId}/pagos`, {
    method: 'POST',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ formaPago }),
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

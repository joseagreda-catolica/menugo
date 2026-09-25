const API_URL = 'http://localhost:3000/api'

function headersConAuth(extra = {}) {
  const token = localStorage.getItem('menugo_token')
  return { ...extra, Authorization: `Bearer ${token}` }
}

async function manejarRespuesta(res) {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || 'Ocurrio un error inesperado.')
  }
  return data
}

// --- Categorias ---

export async function obtenerCategorias() {
  const res = await fetch(`${API_URL}/categorias`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

export async function crearCategoria(datos) {
  const res = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(datos),
  })
  return manejarRespuesta(res)
}

export async function actualizarCategoria(id, datos) {
  const res = await fetch(`${API_URL}/categorias/${id}`, {
    method: 'PATCH',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(datos),
  })
  return manejarRespuesta(res)
}

// --- Platillos ---

export async function obtenerPlatillos() {
  const res = await fetch(`${API_URL}/platillos`, { headers: headersConAuth() })
  return manejarRespuesta(res)
}

export async function crearPlatillo(datos) {
  const res = await fetch(`${API_URL}/platillos`, {
    method: 'POST',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(datos),
  })
  return manejarRespuesta(res)
}

export async function actualizarPlatillo(id, datos) {
  const res = await fetch(`${API_URL}/platillos/${id}`, {
    method: 'PATCH',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(datos),
  })
  return manejarRespuesta(res)
}

export async function actualizarDisponibilidad(id, disponible) {
  const res = await fetch(`${API_URL}/platillos/${id}/disponibilidad`, {
    method: 'PATCH',
    headers: headersConAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ disponible }),
  })
  return manejarRespuesta(res)
}

export async function subirImagenPlatillo(id, archivo) {
  const formData = new FormData()
  formData.append('imagen', archivo)
  const res = await fetch(`${API_URL}/platillos/${id}/imagen`, {
    method: 'POST',
    headers: headersConAuth(),
    body: formData,
  })
  return manejarRespuesta(res)
}

// --- Carta publica (sin autenticacion) ---

export async function obtenerCartaPublica({ categoria, buscar } = {}) {
  const params = new URLSearchParams()
  if (categoria) params.set('categoria', categoria)
  if (buscar) params.set('buscar', buscar)
  const res = await fetch(`${API_URL}/carta-publica?${params}`)
  return manejarRespuesta(res)
}
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

const CLAVE_USUARIO = 'menugo_usuario'
const CLAVE_TOKEN = 'menugo_token'
const MAX_RETARDO_TIMEOUT = 2147483647

// Momento de expiracion (ms) del JWT, leido de su payload. Solo sirve para saber
// cuando cerrar la sesion en el navegador: la firma la verifica siempre el servidor.
// Un token ilegible se trata como vencido; uno sin "exp" no vence.
function expiracionDelToken(jwt) {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp ? payload.exp * 1000 : Infinity
  } catch {
    return 0
  }
}

// Sesion que quedo guardada en el navegador; si esta incompleta o ya vencio se descarta.
function sesionGuardada() {
  try {
    const jwt = localStorage.getItem(CLAVE_TOKEN)
    const guardado = localStorage.getItem(CLAVE_USUARIO)
    if (jwt && guardado && expiracionDelToken(jwt) > Date.now()) {
      return { usuario: JSON.parse(guardado), token: jwt }
    }
  } catch {
    // datos corruptos: se descartan igual que una sesion vencida
  }
  localStorage.removeItem(CLAVE_USUARIO)
  localStorage.removeItem(CLAVE_TOKEN)
  return { usuario: null, token: null }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => sesionGuardada().usuario)
  const [token, setToken] = useState(() => sesionGuardada().token)

  const login = (datosUsuario, jwt) => {
    setUsuario(datosUsuario)
    setToken(jwt)
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datosUsuario))
    localStorage.setItem(CLAVE_TOKEN, jwt)
  }

  const logout = useCallback(() => {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem(CLAVE_USUARIO)
    localStorage.removeItem(CLAVE_TOKEN)
  }, [])

  // Cuando el token vence, la sesion se cierra sola y las rutas protegidas
  // devuelven al login, en vez de dejar la pantalla abierta con peticiones fallando.
  useEffect(() => {
    if (!token) return undefined
    const restante = expiracionDelToken(token) - Date.now()
    if (!Number.isFinite(restante)) return undefined
    const temporizador = setTimeout(logout, Math.min(Math.max(restante, 0), MAX_RETARDO_TIMEOUT))
    return () => clearTimeout(temporizador)
  }, [token, logout])

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

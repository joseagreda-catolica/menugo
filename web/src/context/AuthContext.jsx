/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('menugo_usuario')
    return guardado ? JSON.parse(guardado) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('menugo_token'))

  const login = (datosUsuario, jwt) => {
    setUsuario(datosUsuario)
    setToken(jwt)
    localStorage.setItem('menugo_usuario', JSON.stringify(datosUsuario))
    localStorage.setItem('menugo_token', jwt)
  }

  const logout = () => {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem('menugo_usuario')
    localStorage.removeItem('menugo_token')
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

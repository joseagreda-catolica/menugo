/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  // Mantener un usuario activo para que el Layout renderice tu nombre sin errores
  const [usuario, setUsuario] = useState({
    id: '1',
    nombre: 'Admin Prueba',
    rol: 'ADMINISTRADOR'
  })

  const login = (datosUsuario) => setUsuario(datosUsuario)
  const logout = () => setUsuario(null)

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)